from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class SessionType(str, Enum):
    COURSE = "course"
    PROJECT = "project"


class Session(BaseModel):
    id: Optional[str] = None
    type: SessionType
    referenceId: str  # ID of course or project
    startTime: datetime
    endTime: Optional[datetime] = None
    duration: int = 0  # seconds
    notes: str = ""
    tags: List[str] = []
    manualEntry: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "type": "course",
                "referenceId": "course-123",
                "startTime": "2025-01-15T09:00:00",
                "endTime": "2025-01-15T11:00:00",
                "duration": 7200,
                "notes": "Completed React hooks module",
                "tags": ["learning", "focused"],
                "manualEntry": False
            }
        }
