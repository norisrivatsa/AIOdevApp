from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId
import secrets
import httpx
import re

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def generate_project_id() -> str:
    """Generate a unique project ID"""
    return f"proj_{secrets.token_urlsafe(8)}"


def parse_github_url(url: str) -> Optional[Tuple[str, str]]:
    """Parse GitHub URL to extract owner and repo name."""
    patterns = [
        r'github\.com/([^/]+)/([^/]+?)(?:\.git)?$',
        r'github\.com/([^/]+)/([^/]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            owner, repo = match.groups()
            # Remove .git suffix if present
            repo = repo.replace('.git', '')
            return owner, repo
    return None


async def fetch_github_projects_v2(owner: str, repo: str, token: str) -> dict:
    """Fetch Projects V2 data using GitHub GraphQL API."""
    graphql_url = "https://api.github.com/graphql"

    query = """
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 1) {
          nodes {
            id
            title
            items(first: 100) {
              nodes {
                id
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                  }
                }
                content {
                  ... on Issue {
                    number
                    title
                    state
                    labels(first: 10) {
                      nodes {
                        name
                      }
                    }
                    url
                    createdAt
                    updatedAt
                    body
                    assignees(first: 5) {
                      nodes {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    """

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                graphql_url,
                json={"query": query, "variables": {"owner": owner, "repo": repo}},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=15.0
            )

            if response.status_code != 200:
                print(f"GraphQL Error: {response.status_code} - {response.text}")
                return {}

            data = response.json()

            if "errors" in data:
                print(f"GraphQL Errors: {data['errors']}")
                return {}

            projects = data.get("data", {}).get("repository", {}).get("projectsV2", {}).get("nodes", [])

            if not projects:
                print("No Projects V2 found")
                return {}

            project = projects[0]  # Use first project
            items = project.get("items", {}).get("nodes", [])

            # Map issues to their status from project columns
            issue_status_map = {}

            for item in items:
                content = item.get("content", {})
                if not content or "number" not in content:
                    continue

                issue_number = content["number"]

                # Find status field
                status = "todo"  # Default
                field_values = item.get("fieldValues", {}).get("nodes", [])

                for field_value in field_values:
                    field_name = field_value.get("field", {}).get("name", "").lower()
                    value_name = field_value.get("name", "").lower()

                    if field_name == "status":
                        # Map status values to our categories
                        if any(keyword in value_name for keyword in ["todo", "to do", "backlog"]):
                            status = "todo"
                        elif any(keyword in value_name for keyword in ["in progress", "in-progress", "doing", "wip"]):
                            status = "in_progress"
                        elif any(keyword in value_name for keyword in ["done", "complete", "closed"]):
                            status = "done"
                        break

                issue_status_map[issue_number] = status

            print(f"Found Projects V2 with {len(issue_status_map)} issues mapped to statuses")
            return issue_status_map

        except Exception as e:
            print(f"Error fetching Projects V2: {str(e)}")
            return {}


async def fetch_github_data(owner: str, repo: str, token: str = None) -> dict:
    """Fetch repository data from GitHub API."""
    base_url = "https://api.github.com"

    async with httpx.AsyncClient() as client:
        try:
            # Fetch repository info
            repo_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}",
                headers={"Accept": "application/vnd.github+json"},
                timeout=10.0
            )

            if repo_response.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub repository not found")
            elif repo_response.status_code != 200:
                raise HTTPException(
                    status_code=repo_response.status_code,
                    detail=f"GitHub API error: {repo_response.text}"
                )

            repo_data = repo_response.json()

            # Fetch recent commits (last 10)
            commits_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/commits?per_page=10",
                headers={"Accept": "application/vnd.github+json"},
                timeout=10.0
            )
            commits_data = commits_response.json() if commits_response.status_code == 200 else []

            # Fetch README
            readme_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/readme",
                headers={"Accept": "application/vnd.github.raw"},
                timeout=10.0
            )
            readme_content = readme_response.text if readme_response.status_code == 200 else ""

            # Fetch languages
            languages_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/languages",
                headers={"Accept": "application/vnd.github+json"},
                timeout=10.0
            )
            languages_data = languages_response.json() if languages_response.status_code == 200 else {}

            # Fetch issues (all states)
            issues_response = await client.get(
                f"{base_url}/repos/{owner}/{repo}/issues?state=all&per_page=100",
                headers={"Accept": "application/vnd.github+json"},
                timeout=10.0
            )
            issues_data = issues_response.json() if issues_response.status_code == 200 else []

            # Try to fetch Projects V2 data if token is provided
            project_columns = {}
            if token:
                print("Token provided - attempting to fetch Projects V2 via GraphQL")
                project_columns = await fetch_github_projects_v2(owner, repo, token)

            # Fall back to Classic Projects if no token or V2 fetch failed
            if not project_columns:
                print("Trying Classic Projects API as fallback")
                projects_response = await client.get(
                    f"{base_url}/repos/{owner}/{repo}/projects",
                    headers={
                        "Accept": "application/vnd.github.inertia-preview+json",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    timeout=10.0
                )

                print(f"Projects API Status: {projects_response.status_code}")
                if projects_response.status_code != 200:
                    print(f"Projects API Response: {projects_response.text}")

                projects_data = projects_response.json() if projects_response.status_code == 200 else []
                print(f"Found {len(projects_data)} classic projects")

                # If there's a classic project, fetch its columns and cards
                if projects_data and len(projects_data) > 0:
                    project_id = projects_data[0].get("id")  # Use first project
                    columns_response = await client.get(
                        f"{base_url}/projects/{project_id}/columns",
                        headers={
                            "Accept": "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28"
                        },
                        timeout=10.0
                    )
                    columns_data = columns_response.json() if columns_response.status_code == 200 else []

                    # For each column, fetch the cards
                    for column in columns_data:
                        column_name = column.get("name", "").lower()
                        column_id = column.get("id")

                        cards_response = await client.get(
                            f"{base_url}/projects/columns/{column_id}/cards",
                            headers={
                                "Accept": "application/vnd.github+json",
                                "X-GitHub-Api-Version": "2022-11-28"
                            },
                            timeout=10.0
                        )
                        cards_data = cards_response.json() if cards_response.status_code == 200 else []

                        # Map column to status
                        if "todo" in column_name or "to do" in column_name or "backlog" in column_name:
                            status = "todo"
                        elif "progress" in column_name or "doing" in column_name or "wip" in column_name:
                            status = "in_progress"
                        elif "done" in column_name or "complete" in column_name or "closed" in column_name:
                            status = "done"
                        else:
                            status = "todo"  # Default

                        # Store issue URLs from cards with their status
                        for card in cards_data:
                            content_url = card.get("content_url")
                            if content_url and "/issues/" in content_url:
                                issue_number = int(content_url.split("/issues/")[-1])
                                project_columns[issue_number] = status

            # Parse commit data
            parsed_commits = []
            for commit in commits_data[:10]:
                parsed_commits.append({
                    "sha": commit.get("sha", "")[:7],
                    "message": commit.get("commit", {}).get("message", ""),
                    "author": commit.get("commit", {}).get("author", {}).get("name", ""),
                    "date": commit.get("commit", {}).get("author", {}).get("date", ""),
                    "url": commit.get("html_url", "")
                })

            # Parse issues data
            parsed_issues = []
            for issue in issues_data:
                # Skip pull requests (they appear in issues API)
                if "pull_request" in issue:
                    continue

                issue_number = issue.get("number")
                labels = [label.get("name", "") for label in issue.get("labels", [])]

                # Determine status - prioritize GitHub Project status if available
                if issue_number in project_columns:
                    # Use status from GitHub Project board
                    status = project_columns[issue_number]
                else:
                    # Fall back to label-based and state-based logic
                    if issue.get("state") == "closed":
                        status = "done"
                    elif any(label.lower() in ["in progress", "in-progress", "wip", "doing"] for label in labels):
                        status = "in_progress"
                    else:
                        status = "todo"

                parsed_issues.append({
                    "number": issue_number,
                    "title": issue.get("title", ""),
                    "state": issue.get("state", "open"),
                    "status": status,
                    "labels": labels,
                    "assignees": [a.get("login") for a in issue.get("assignees", [])],
                    "created_at": issue.get("created_at", ""),
                    "updated_at": issue.get("updated_at", ""),
                    "url": issue.get("html_url", ""),
                    "body": issue.get("body", "")[:500] if issue.get("body") else "",
                })

            return {
                "name": repo_data.get("name", ""),
                "description": repo_data.get("description", ""),
                "stars": repo_data.get("stargazers_count", 0),
                "forks": repo_data.get("forks_count", 0),
                "openIssues": repo_data.get("open_issues_count", 0),
                "watchers": repo_data.get("watchers_count", 0),
                "defaultBranch": repo_data.get("default_branch", "main"),
                "lastUpdated": repo_data.get("updated_at"),
                "commits": parsed_commits,
                "issues": parsed_issues,
                "hasProjects": len(project_columns) > 0,  # Whether using GitHub Projects
                "readme": readme_content[:5000],  # Limit README size
                "languages": list(languages_data.keys()),
                "topics": repo_data.get("topics", []),
            }

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="GitHub API timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Failed to connect to GitHub: {str(e)}")


def serialize_project(project_doc: dict) -> dict:
    """Convert MongoDB document to Project model."""
    if project_doc and "_id" in project_doc:
        project_doc["id"] = str(project_doc["_id"])
        del project_doc["_id"]
    return project_doc


@router.get("/", response_model=List[Project])
async def list_projects(
    status_filter: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all projects with optional status filter."""
    query = {}
    if status_filter:
        query["status"] = status_filter

    projects = await db.projects.find(query).sort("createdAt", -1).to_list(100)
    return [serialize_project(project) for project in projects]


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new project."""
    project_dict = project.model_dump()
    project_dict["projectId"] = generate_project_id()  # Generate custom ID
    project_dict["createdAt"] = datetime.utcnow()
    project_dict["updatedAt"] = datetime.utcnow()

    result = await db.projects.insert_one(project_dict)
    created_project = await db.projects.find_one({"_id": result.inserted_id})

    return serialize_project(created_project)


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific project by ID."""
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return serialize_project(project)


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing project."""
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    # Check if project exists
    existing_project = await db.projects.find_one({"_id": oid})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update project - only update fields that are provided (not None)
    update_dict = project_update.model_dump(exclude_unset=True)
    update_dict["updatedAt"] = datetime.utcnow()

    await db.projects.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_project = await db.projects.find_one({"_id": oid})
    return serialize_project(updated_project)


@router.patch("/{project_id}", response_model=Project)
async def partial_update_project(
    project_id: str,
    updates: dict,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Partially update specific fields of a project."""
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    # Check if project exists
    existing_project = await db.projects.find_one({"_id": oid})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Add updatedAt timestamp
    updates["updatedAt"] = datetime.utcnow()

    # Update only the provided fields
    await db.projects.update_one(
        {"_id": oid},
        {"$set": updates}
    )

    updated_project = await db.projects.find_one({"_id": oid})
    return serialize_project(updated_project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a project."""
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    result = await db.projects.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return None


@router.post("/{project_id}/sync-github", response_model=Project)
async def sync_github_data(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Sync GitHub data for a project.
    Fetches repository info, commits, README, and languages from GitHub API.
    """
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = await db.projects.find_one({"_id": oid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    github_url = project.get("githubRepoUrl") or project.get("repositoryUrl")
    if not github_url:
        raise HTTPException(status_code=400, detail="No GitHub repository URL configured")

    # Parse GitHub URL
    parsed = parse_github_url(github_url)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid GitHub URL format")

    owner, repo = parsed

    # Get GitHub token from project if available
    github_token = project.get("githubToken", "")

    # Fetch data from GitHub
    github_data = await fetch_github_data(owner, repo, github_token if github_token else None)

    # Update project with GitHub data
    await db.projects.update_one(
        {"_id": oid},
        {
            "$set": {
                "githubData.stars": github_data["stars"],
                "githubData.forks": github_data["forks"],
                "githubData.openIssues": github_data["openIssues"],
                "githubData.watchers": github_data["watchers"],
                "githubData.lastUpdated": github_data["lastUpdated"],
                "githubData.lastFetched": datetime.utcnow(),
                "githubData.fetched": True,
                "githubData.commits": github_data["commits"],
                "githubData.issues": github_data["issues"],
                "githubData.hasProjects": github_data["hasProjects"],
                "githubData.readme": github_data["readme"],
                "updatedAt": datetime.utcnow()
            }
        }
    )

    updated_project = await db.projects.find_one({"_id": oid})
    return serialize_project(updated_project)
