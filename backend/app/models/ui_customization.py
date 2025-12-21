from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CardLayout(BaseModel):
    """Individual card layout configuration"""
    cardId: str
    cardType: str  # 'timer', 'stats', 'courses', etc.
    x: int  # Grid position X
    y: int  # Grid position Y
    w: int  # Width in grid units
    h: int  # Height in grid units
    locked: bool = False  # Whether card is locked in place
    aspectRatioLocked: bool = True  # Whether to maintain aspect ratio when resizing
    minW: int = 1  # Minimum width
    minH: int = 1  # Minimum height
    maxW: Optional[int] = None  # Maximum width
    maxH: Optional[int] = None  # Maximum height

class BoardCustomization(BaseModel):
    """Customization for a specific board"""
    boardId: str
    boardName: str
    gridCols: int = 12  # Number of columns in grid
    gridRowHeight: int = 100  # Height of each row in pixels
    cards: List[CardLayout] = []

class UICustomization(BaseModel):
    """User's UI customizations"""
    id: Optional[str] = Field(None, alias="_id")
    userId: str = "default"  # For future multi-user support
    boards: List[BoardCustomization] = []
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UICustomizationCreate(BaseModel):
    """Create UI customization"""
    boards: List[BoardCustomization]

class UICustomizationUpdate(BaseModel):
    """Update UI customization"""
    boards: List[BoardCustomization]
