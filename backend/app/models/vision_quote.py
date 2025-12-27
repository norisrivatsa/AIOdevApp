from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VisionQuote(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    quoteText: str
    author: Optional[str] = None
    isActive: bool = True
    order: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "quoteText": "The only way to do great work is to love what you do.",
                "author": "Steve Jobs",
                "isActive": True,
                "order": 0
            }
        }


class VisionQuoteCreate(BaseModel):
    quoteText: str
    author: Optional[str] = None
    isActive: bool = True
    order: int = 0


class VisionQuoteUpdate(BaseModel):
    quoteText: Optional[str] = None
    author: Optional[str] = None
    isActive: Optional[bool] = None
    order: Optional[int] = None
