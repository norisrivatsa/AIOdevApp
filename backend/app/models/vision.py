from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class CardType(str, Enum):
    CUSTOM = "custom"
    SUBJECT_GOALS = "subject_goals"
    PROJECT_GOALS = "project_goals"
    FINANCIAL_GOALS = "financial_goals"
    CAREER_GOALS = "career_goals"
    INSPIRATION = "inspiration"
    ACHIEVEMENTS = "achievements"


class CardSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    WIDE = "wide"


class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GoalPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CardPosition(BaseModel):
    x: int = 0
    y: int = 0


# Vision Goal (embedded in card)
class VisionGoal(BaseModel):
    goalId: str
    name: str
    description: str = ""
    status: GoalStatus = GoalStatus.NOT_STARTED
    priority: GoalPriority = GoalPriority.MEDIUM
    linkedProjectId: Optional[str] = None  # Custom projectId
    linkedSubjectId: Optional[str] = None  # Custom subjectId
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None


# Vision Card (embedded in visions document)
class VisionCard(BaseModel):
    cardId: str
    title: str
    type: CardType = CardType.CUSTOM
    size: CardSize = CardSize.MEDIUM
    colorCode: str = "#3B82F6"
    position: CardPosition = Field(default_factory=CardPosition)
    collapsed: bool = False
    goals: List[VisionGoal] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# Vision Quote (embedded in visions document)
class VisionQuote(BaseModel):
    quoteId: str
    quoteText: str
    author: str = ""
    isActive: bool = True
    order: int = 0


# Main Visions Document
class Vision(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None  # For multi-user support
    cards: List[VisionCard] = []
    quotes: List[VisionQuote] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# DTOs for API requests
class VisionCardCreate(BaseModel):
    title: str
    type: CardType = CardType.CUSTOM
    size: CardSize = CardSize.MEDIUM
    colorCode: str = "#3B82F6"
    position: CardPosition = Field(default_factory=CardPosition)


class VisionCardUpdate(BaseModel):
    title: Optional[str] = None
    size: Optional[CardSize] = None
    colorCode: Optional[str] = None
    position: Optional[CardPosition] = None
    collapsed: Optional[bool] = None


class VisionGoalCreate(BaseModel):
    name: str
    description: str = ""
    status: GoalStatus = GoalStatus.NOT_STARTED
    priority: GoalPriority = GoalPriority.MEDIUM
    linkedProjectId: Optional[str] = None
    linkedSubjectId: Optional[str] = None


class VisionGoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[GoalStatus] = None
    priority: Optional[GoalPriority] = None
    linkedProjectId: Optional[str] = None
    linkedSubjectId: Optional[str] = None


class VisionQuoteCreate(BaseModel):
    quoteText: str
    author: str = ""
    isActive: bool = True
    order: int = 0


class VisionQuoteUpdate(BaseModel):
    quoteText: Optional[str] = None
    author: Optional[str] = None
    isActive: Optional[bool] = None
    order: Optional[int] = None
