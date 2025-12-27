from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from enum import Enum


class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GoalPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Milestone(BaseModel):
    name: str
    completed: bool = False
    completedDate: Optional[datetime] = None


class VisionGoal(BaseModel):
    id: Optional[str] = None
    cardId: str
    name: str
    description: str = ""
    target: Optional[str] = None  # Flexible field for different target types
    status: GoalStatus = GoalStatus.NOT_STARTED
    priority: GoalPriority = GoalPriority.MEDIUM

    # Subject goals specific
    linkedSubjectId: Optional[str] = None
    targetDate: Optional[datetime] = None

    # Project goals specific
    linkedProjectId: Optional[str] = None
    projectTargetDate: Optional[datetime] = None

    # Financial goals specific
    targetAmount: Optional[float] = None
    currency: str = "USD"
    currentProgress: float = 0.0
    financialTargetDate: Optional[datetime] = None

    # Career goals specific
    milestones: List[Milestone] = []
    careerTargetDate: Optional[datetime] = None

    # Inspiration specific
    imageUrl: Optional[str] = None
    externalUrl: Optional[str] = None
    tags: List[str] = []

    # Achievements specific
    completedDate: Optional[datetime] = None
    category: Optional[str] = None
    evidenceUrl: Optional[str] = None

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "cardId": "card123",
                "name": "Learn React Advanced Patterns",
                "description": "Master hooks, context, and performance optimization",
                "status": "in_progress",
                "priority": "high",
                "linkedSubjectId": "subject456",
                "targetDate": "2025-12-31T00:00:00Z"
            }
        }


class VisionGoalCreate(BaseModel):
    cardId: str
    name: str
    description: str = ""
    target: Optional[str] = None
    status: GoalStatus = GoalStatus.NOT_STARTED
    priority: GoalPriority = GoalPriority.MEDIUM

    # Optional fields based on card type
    linkedSubjectId: Optional[str] = None
    targetDate: Optional[datetime] = None
    linkedProjectId: Optional[str] = None
    projectTargetDate: Optional[datetime] = None
    targetAmount: Optional[float] = None
    currency: str = "USD"
    currentProgress: float = 0.0
    financialTargetDate: Optional[datetime] = None
    milestones: List[Milestone] = []
    careerTargetDate: Optional[datetime] = None
    imageUrl: Optional[str] = None
    externalUrl: Optional[str] = None
    tags: List[str] = []
    completedDate: Optional[datetime] = None
    category: Optional[str] = None
    evidenceUrl: Optional[str] = None


class VisionGoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target: Optional[str] = None
    status: Optional[GoalStatus] = None
    priority: Optional[GoalPriority] = None
    linkedSubjectId: Optional[str] = None
    targetDate: Optional[datetime] = None
    linkedProjectId: Optional[str] = None
    projectTargetDate: Optional[datetime] = None
    targetAmount: Optional[float] = None
    currency: Optional[str] = None
    currentProgress: Optional[float] = None
    financialTargetDate: Optional[datetime] = None
    milestones: Optional[List[Milestone]] = None
    careerTargetDate: Optional[datetime] = None
    imageUrl: Optional[str] = None
    externalUrl: Optional[str] = None
    tags: Optional[List[str]] = None
    completedDate: Optional[datetime] = None
    category: Optional[str] = None
    evidenceUrl: Optional[str] = None
