from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"


class UserSettings(BaseModel):
    id: Optional[str] = None
    theme: Theme = Theme.LIGHT
    defaultBoard: Optional[str] = None  # Board ID
    idleThreshold: int = 5  # minutes
    autoSaveInterval: int = 30  # seconds
    keyboardShortcuts: Dict[str, str] = Field(default_factory=dict)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "theme": "dark",
                "idleThreshold": 5,
                "autoSaveInterval": 30,
                "keyboardShortcuts": {
                    "nextBoard": "ArrowRight",
                    "prevBoard": "ArrowLeft",
                    "commandPalette": "Ctrl+K"
                }
            }
        }
