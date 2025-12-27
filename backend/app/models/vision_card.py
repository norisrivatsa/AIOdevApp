from datetime import datetime
from typing import Optional
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
    SMALL = "small"      # 1x1 (300x300px)
    MEDIUM = "medium"    # 2x1 (600x300px)
    LARGE = "large"      # 2x2 (600x600px)
    WIDE = "wide"        # 3x1 (900x300px)


class CardPosition(BaseModel):
    x: int = 0
    y: int = 0


class VisionCard(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    title: str
    type: CardType = CardType.CUSTOM
    size: CardSize = CardSize.MEDIUM
    colorCode: str = "#3B82F6"
    position: CardPosition = Field(default_factory=CardPosition)
    collapsed: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "2025 Learning Goals",
                "type": "subject_goals",
                "size": "medium",
                "colorCode": "#3B82F6",
                "position": {"x": 0, "y": 0},
                "collapsed": False
            }
        }


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
