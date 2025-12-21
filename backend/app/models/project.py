from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class GitHubData(BaseModel):
    issues: List[Any] = []
    commits: List[Any] = []
    lastFetched: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "issues": [],
                "commits": [],
                "lastFetched": "2025-01-15T10:30:00"
            }
        }


class Project(BaseModel):
    id: Optional[str] = None
    name: str
    description: str = ""
    status: ProjectStatus = ProjectStatus.PLANNING
    repositoryUrl: str = ""
    tags: List[str] = []
    githubData: GitHubData = Field(default_factory=GitHubData)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Time Tracker App",
                "description": "A full-stack time tracking application",
                "status": "active",
                "repositoryUrl": "https://github.com/user/time-tracker",
                "tags": ["react", "fastapi", "mongodb"]
            }
        }
