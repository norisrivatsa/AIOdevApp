from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class CourseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class Subtopic(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    title: str
    completed: bool = False
    order: int = 0

    class Config:
        json_schema_extra = {
            "example": {
                "id": "1234567890",
                "title": "Introduction to Python",
                "completed": False,
                "order": 0
            }
        }


class Resource(BaseModel):
    url: str
    title: str

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://docs.python.org",
                "title": "Python Documentation"
            }
        }


class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    status: CourseStatus = CourseStatus.NOT_STARTED
    startDate: Optional[datetime] = None
    targetEndDate: Optional[datetime] = None
    timeGoal: float = 0.0  # hours
    subtopics: List[Subtopic] = []
    tags: List[str] = []
    notes: str = ""
    resources: List[Resource] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Full Stack Web Development",
                "description": "Learn React, Node.js, and MongoDB",
                "status": "in_progress",
                "timeGoal": 40.0,
                "tags": ["web-development", "fullstack"],
                "subtopics": [
                    {
                        "id": "1",
                        "title": "React Basics",
                        "completed": True,
                        "order": 0
                    }
                ]
            }
        }
