from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum
import uuid


class SubjectStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    REVIEWING = "reviewing"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class ResourceType(str, Enum):
    DOCUMENTATION = "documentation"
    GITHUB = "github"
    ARTICLE = "article"
    VIDEO = "video"
    BOOK = "book"
    NOTES = "notes"
    OTHER = "other"


class SubtopicStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"


class Subtopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: SubtopicStatus = SubtopicStatus.ACTIVE
    completedDate: Optional[datetime] = None
    cachedCompletion: float = 0.0  # Cached completion percentage (0-100)
    order: int = 0
    subtopics: List['Subtopic'] = []  # Nested subtopics

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-here",
                "name": "Introduction to Python",
                "status": "active",
                "completedDate": None,
                "order": 0,
                "cachedCompletion": 0.0,
                "subtopics": []
            }
        }


# Enable forward references for recursive model
Subtopic.model_rebuild()


class KnowledgeBaseLink(BaseModel):
    label: str
    url: str
    type: ResourceType = ResourceType.DOCUMENTATION

    class Config:
        json_schema_extra = {
            "example": {
                "label": "Official Documentation",
                "url": "https://docs.python.org",
                "type": "documentation"
            }
        }


class ResourceLink(BaseModel):
    label: str
    url: str

    class Config:
        json_schema_extra = {
            "example": {
                "label": "Course Playlist",
                "url": "https://www.youtube.com/playlist?list=..."
            }
        }


class IconSettings(BaseModel):
    type: str = "emoji"  # emoji | upload | initials
    value: str = "📚"

    class Config:
        json_schema_extra = {
            "example": {
                "type": "emoji",
                "value": "📚"
            }
        }


class CostInfo(BaseModel):
    isFree: bool = True
    amount: float = 0.0
    currency: str = "USD"

    class Config:
        json_schema_extra = {
            "example": {
                "isFree": True,
                "amount": 0.0,
                "currency": "USD"
            }
        }


class Subject(BaseModel):
    id: Optional[str] = None
    subjectId: Optional[str] = None  # Custom unique ID for linking

    # Required fields
    name: str  # Changed from 'title' to match spec
    priority: Priority = Priority.MEDIUM

    # Auto-set fields
    status: SubjectStatus = SubjectStatus.NOT_STARTED
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Basic Information
    description: str = ""
    colorCode: str = "#3B82F6"
    category: str = "programming"  # Domain/Category
    difficultyLevel: DifficultyLevel = DifficultyLevel.BEGINNER
    platform: str = ""  # Udemy, Coursera, YouTube, etc.
    instructor: str = ""  # Course instructor or author
    courseUrl: str = ""  # URL to the course
    language: str = "English"

    # Timeline & Goals
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None  # Changed from targetEndDate
    estimatedHours: Optional[float] = None  # Changed from timeGoal
    weeklyGoalHours: Optional[float] = None

    # Relationships
    prerequisites: List[str] = []  # Array of subject IDs
    relatedSubjects: List[str] = []  # Array of subject IDs
    relatedProjects: List[str] = []  # Array of project IDs
    tags: List[str] = []

    # Knowledge Base & Resources
    knowledgeBaseLinks: List[KnowledgeBaseLink] = []
    resourceLinks: List[ResourceLink] = []

    # Subtopics - Hierarchical structure
    subtopics: List[Subtopic] = []

    # Additional Settings
    icon: IconSettings = Field(default_factory=lambda: IconSettings(type="emoji", value="📚"))
    certification: str = ""
    cost: CostInfo = Field(default_factory=CostInfo)
    notes: str = ""

    # Metadata (calculated/tracked)
    progress: float = 0.0  # Auto-calculated from subtopic completion (0-100) - same as completionPercentage
    completionPercentage: float = 0.0  # Overall completion percentage (0-100)
    completedSubtopicsCount: int = 0  # Total checked subtopics (all levels)
    totalSubtopicsCount: int = 0  # Total subtopics (all levels)
    timeSpent: float = 0.0  # Calculated from sessions (hours)
    lastStudied: Optional[datetime] = None
    sessions: List[str] = []  # Array of session IDs for backup/cross-checking

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Full Stack Web Development",
                "priority": "high",
                "description": "Learn React, Node.js, and MongoDB",
                "colorCode": "#3B82F6",
                "category": "programming",
                "difficultyLevel": "intermediate",
                "platform": "Udemy",
                "instructor": "John Doe",
                "courseUrl": "https://www.udemy.com/course/fullstack",
                "language": "English",
                "estimatedHours": 40.0,
                "weeklyGoalHours": 10.0,
                "tags": ["web-development", "fullstack", "react"],
                "knowledgeBaseLinks": [
                    {
                        "label": "React Docs",
                        "url": "https://react.dev",
                        "type": "documentation"
                    }
                ],
                "subtopics": [
                    {
                        "id": "uuid-1",
                        "name": "React Basics",
                        "completed": True,
                        "order": 0,
                        "level": 0,
                        "parentId": None,
                        "children": ["uuid-2"]
                    }
                ],
                "icon": {
                    "type": "emoji",
                    "value": "⚛️"
                },
                "certification": "Full Stack Developer Certificate",
                "cost": {
                    "isFree": False,
                    "amount": 99.99,
                    "currency": "USD"
                }
            }
        }


class SubjectCreate(BaseModel):
    """Schema for creating a new subject"""
    # Required fields
    name: str
    priority: Priority = Priority.MEDIUM

    # Optional fields
    status: SubjectStatus = SubjectStatus.NOT_STARTED
    description: str = ""
    colorCode: str = "#3B82F6"
    category: str = "programming"
    difficultyLevel: DifficultyLevel = DifficultyLevel.BEGINNER
    platform: str = ""
    instructor: str = ""
    courseUrl: str = ""
    language: str = "English"
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None
    estimatedHours: Optional[float] = None
    weeklyGoalHours: Optional[float] = None
    prerequisites: List[str] = []
    relatedSubjects: List[str] = []
    relatedProjects: List[str] = []
    tags: List[str] = []
    knowledgeBaseLinks: List[KnowledgeBaseLink] = []
    resourceLinks: List[ResourceLink] = []
    subtopics: List[Subtopic] = []
    icon: IconSettings = Field(default_factory=lambda: IconSettings(type="emoji", value="📚"))
    certification: str = ""
    cost: CostInfo = Field(default_factory=CostInfo)
    notes: str = ""


class SubjectUpdate(BaseModel):
    """Schema for updating a subject"""
    name: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[SubjectStatus] = None
    description: Optional[str] = None
    colorCode: Optional[str] = None
    category: Optional[str] = None
    difficultyLevel: Optional[DifficultyLevel] = None
    platform: Optional[str] = None
    instructor: Optional[str] = None
    courseUrl: Optional[str] = None
    language: Optional[str] = None
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None
    estimatedHours: Optional[float] = None
    weeklyGoalHours: Optional[float] = None
    prerequisites: Optional[List[str]] = None
    relatedSubjects: Optional[List[str]] = None
    relatedProjects: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    knowledgeBaseLinks: Optional[List[KnowledgeBaseLink]] = None
    resourceLinks: Optional[List[ResourceLink]] = None
    subtopics: Optional[List[Subtopic]] = None
    icon: Optional[IconSettings] = None
    certification: Optional[str] = None
    cost: Optional[CostInfo] = None
    notes: Optional[str] = None
    progress: Optional[float] = None
    completionPercentage: Optional[float] = None
    completedSubtopicsCount: Optional[int] = None
    totalSubtopicsCount: Optional[int] = None
    timeSpent: Optional[float] = None
    lastStudied: Optional[datetime] = None
