from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


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
    This is a placeholder for GitHub API integration.
    """
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = await db.projects.find_one({"_id": oid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.get("repositoryUrl"):
        raise HTTPException(status_code=400, detail="No repository URL configured")

    # TODO: Implement actual GitHub API integration
    # For now, just update the lastFetched timestamp
    await db.projects.update_one(
        {"_id": oid},
        {
            "$set": {
                "githubData.lastFetched": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )

    updated_project = await db.projects.find_one({"_id": oid})
    return serialize_project(updated_project)
