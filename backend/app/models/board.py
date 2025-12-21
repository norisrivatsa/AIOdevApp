from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class CardPosition(BaseModel):
    x: int = 0
    y: int = 0


class CardSize(BaseModel):
    width: int = 1  # Grid units
    height: int = 1  # Grid units


class Card(BaseModel):
    cardType: str
    position: CardPosition = Field(default_factory=CardPosition)
    size: CardSize = Field(default_factory=CardSize)
    config: Dict[str, Any] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "cardType": "timer",
                "position": {"x": 0, "y": 0},
                "size": {"width": 2, "height": 1},
                "config": {}
            }
        }


class BoardLayout(BaseModel):
    cards: List[Card] = []


class Board(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None  # For future multi-user support
    name: str
    order: int = 0
    isDefault: bool = False
    layout: BoardLayout = Field(default_factory=BoardLayout)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Dashboard",
                "order": 0,
                "isDefault": True,
                "layout": {
                    "cards": [
                        {
                            "cardType": "active-courses",
                            "position": {"x": 0, "y": 0},
                            "size": {"width": 2, "height": 2}
                        }
                    ]
                }
            }
        }
