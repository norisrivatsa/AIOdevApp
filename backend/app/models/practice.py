from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class PracticePlatform(str, Enum):
    LEETCODE = "leetcode"
    CODEFORCES = "codeforces"
    HACKERRANK = "hackerrank"
    CODEWARS = "codewars"
    OTHER = "other"


class PracticeDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Practice(BaseModel):
    id: Optional[str] = None
    platform: PracticePlatform
    platformUrl: str = ""  # Link to user's profile on the platform
    problemsSolved: int = 0
    easyCount: int = 0
    mediumCount: int = 0
    hardCount: int = 0
    tags: List[str] = []
    notes: str = ""
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "platform": "leetcode",
                "platformUrl": "https://leetcode.com/username",
                "problemsSolved": 150,
                "easyCount": 50,
                "mediumCount": 75,
                "hardCount": 25,
                "tags": ["algorithms", "data-structures"],
                "notes": "Focusing on dynamic programming problems"
            }
        }
