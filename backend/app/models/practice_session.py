from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class PracticeType(str, Enum):
    CODING = "coding"
    PROBLEM_SOLVING = "problem_solving"
    READING = "reading"
    WRITING = "writing"
    PRACTICAL = "practical"
    EXERCISES = "exercises"
    OTHER = "other"


class PracticeSession(BaseModel):
    id: Optional[str] = None
    subjectId: str  # Link to subject
    title: str
    practiceType: PracticeType = PracticeType.OTHER
    description: str = ""
    notes: str = ""

    # Time tracking
    duration: int = 0  # Duration in seconds
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None

    # Links and resources used during practice
    resourceLinks: List[dict] = []  # List of {label: str, url: str}

    # Metrics (optional, for specific practice types)
    problemsSolved: int = 0
    tasksCompleted: int = 0
    pagesRead: int = 0

    # Metadata
    tags: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "subjectId": "subj_abc123",
                "title": "Array Problems Practice",
                "practiceType": "coding",
                "description": "Solved array manipulation problems",
                "notes": "Focused on two-pointer technique",
                "duration": 3600,
                "problemsSolved": 5,
                "resourceLinks": [
                    {"label": "LeetCode", "url": "https://leetcode.com"},
                    {"label": "Notes", "url": "obsidian://vault/notes"}
                ],
                "tags": ["arrays", "two-pointers"]
            }
        }


class PracticeSessionCreate(BaseModel):
    """Schema for creating a new practice session"""
    subjectId: str
    title: str
    practiceType: PracticeType = PracticeType.OTHER
    description: str = ""
    notes: str = ""
    duration: int = 0
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    resourceLinks: List[dict] = []
    problemsSolved: int = 0
    tasksCompleted: int = 0
    pagesRead: int = 0
    tags: List[str] = []


class PracticeSessionUpdate(BaseModel):
    """Schema for updating a practice session"""
    title: Optional[str] = None
    practiceType: Optional[PracticeType] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    duration: Optional[int] = None
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    resourceLinks: Optional[List[dict]] = None
    problemsSolved: Optional[int] = None
    tasksCompleted: Optional[int] = None
    pagesRead: Optional[int] = None
    tags: Optional[List[str]] = None
