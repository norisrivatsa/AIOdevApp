from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
import random
import re


class ReferenceType(str, Enum):
    """What the session is for"""
    SUBJECT = "subject"
    PROJECT = "project"
    PRACTICE_PLATFORM = "practice_platform"


class SessionType(str, Enum):
    """Type of activity in the session"""
    STUDY = "study"
    PRACTICE = "practice"


def generate_session_id(reference_type: str, name: str) -> str:
    """
    Generate custom session ID format:
    - Subject: SubCprogN03214319
    - Project: ProjTaskMN12345
    - Practice Platform: PracLeetN98765
    """
    # Clean name: remove spaces, special chars, take first 5 chars
    clean_name = re.sub(r'[^a-zA-Z0-9]', '', name)[:5]

    # Prefix based on reference type
    prefix_map = {
        "subject": "Sub",
        "project": "Proj",
        "practice_platform": "Prac"
    }
    prefix = prefix_map.get(reference_type, "Sess")

    # Type indicator
    type_indicator = "N"  # N for session number

    # Random 8-digit number
    random_num = random.randint(10000000, 99999999)

    return f"{prefix}{clean_name}{type_indicator}{random_num}"


class Session(BaseModel):
    id: Optional[str] = None
    uniqueId: Optional[str] = None  # Custom formatted ID
    name: str  # Name of subject/project
    referenceType: ReferenceType  # What it's for (subject/project/practice_platform)
    referenceId: str  # ID of subject, project, or practice platform
    sessionType: SessionType  # Type of activity (study/practice)
    date: datetime  # Date of the session
    startTime: datetime
    endTime: Optional[datetime] = None
    duration: int = 0  # Duration in MINUTES (not seconds)
    notes: str = ""
    tags: List[str] = []
    manualEntry: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "uniqueId": "SubCprogN03214319",
                "name": "C Programming",
                "referenceType": "subject",
                "referenceId": "subject-123",
                "sessionType": "study",
                "date": "2025-01-15T00:00:00",
                "startTime": "2025-01-15T09:00:00",
                "endTime": "2025-01-15T11:00:00",
                "duration": 120,
                "notes": "Completed React hooks module",
                "tags": ["learning", "focused"],
                "manualEntry": False
            }
        }
