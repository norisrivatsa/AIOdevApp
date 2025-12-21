from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from app.models.settings import UserSettings
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_settings(settings_doc: dict) -> dict:
    """Convert MongoDB document to UserSettings model."""
    if settings_doc and "_id" in settings_doc:
        settings_doc["id"] = str(settings_doc["_id"])
        del settings_doc["_id"]
    return settings_doc


async def get_or_create_settings(db: AsyncIOMotorDatabase) -> dict:
    """Get existing settings or create default settings."""
    settings = await db.settings.find_one()

    if not settings:
        # Create default settings
        default_settings = {
            "theme": "light",
            "idleThreshold": 5,
            "autoSaveInterval": 30,
            "keyboardShortcuts": {
                "nextBoard": "ArrowRight",
                "prevBoard": "ArrowLeft",
                "commandPalette": "Ctrl+K",
                "newItem": "Ctrl+N",
                "save": "Ctrl+S",
                "settings": "Ctrl+,",
                "search": "Ctrl+F",
                "toggleSidebar": "Ctrl+B",
                "startStopTimer": "Space"
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = await db.settings.insert_one(default_settings)
        settings = await db.settings.find_one({"_id": result.inserted_id})

    return settings


@router.get("/", response_model=UserSettings)
async def get_settings(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get user settings."""
    settings = await get_or_create_settings(db)
    return serialize_settings(settings)


@router.put("/", response_model=UserSettings)
async def update_settings(
    settings_update: UserSettings,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user settings."""
    # Get existing settings or create if not exists
    existing_settings = await get_or_create_settings(db)

    # Update settings
    update_dict = settings_update.model_dump(exclude={"id", "createdAt"})
    update_dict["updatedAt"] = datetime.utcnow()

    await db.settings.update_one(
        {"_id": existing_settings["_id"]},
        {"$set": update_dict}
    )

    updated_settings = await db.settings.find_one({"_id": existing_settings["_id"]})
    return serialize_settings(updated_settings)
