from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from app.models.practice import Practice
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


class PracticeStatsUpdate(BaseModel):
    """Model for updating practice statistics."""
    problemsSolved: int
    easyCount: int
    mediumCount: int
    hardCount: int


def serialize_practice(practice_doc: dict) -> dict:
    """Convert MongoDB document to Practice model."""
    if practice_doc and "_id" in practice_doc:
        practice_doc["id"] = str(practice_doc["_id"])
        del practice_doc["_id"]
    return practice_doc


@router.get("/", response_model=List[Practice])
async def list_practices(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all practice platforms."""
    practices = await db.practices.find({}).sort("createdAt", -1).to_list(100)
    return [serialize_practice(practice) for practice in practices]


@router.post("/", response_model=Practice, status_code=status.HTTP_201_CREATED)
async def create_practice(
    practice: Practice,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new practice platform entry."""
    practice_dict = practice.model_dump(exclude={"id"})
    practice_dict["createdAt"] = datetime.utcnow()
    practice_dict["updatedAt"] = datetime.utcnow()

    result = await db.practices.insert_one(practice_dict)
    created_practice = await db.practices.find_one({"_id": result.inserted_id})

    return serialize_practice(created_practice)


@router.get("/{practice_id}", response_model=Practice)
async def get_practice(
    practice_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific practice platform by ID."""
    try:
        practice = await db.practices.find_one({"_id": ObjectId(practice_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid practice ID format")

    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    return serialize_practice(practice)


@router.put("/{practice_id}", response_model=Practice)
async def update_practice(
    practice_id: str,
    practice_update: Practice,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing practice platform."""
    try:
        oid = ObjectId(practice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid practice ID format")

    # Check if practice exists
    existing_practice = await db.practices.find_one({"_id": oid})
    if not existing_practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    # Update practice
    update_dict = practice_update.model_dump(exclude={"id", "createdAt"})
    update_dict["updatedAt"] = datetime.utcnow()

    await db.practices.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_practice = await db.practices.find_one({"_id": oid})
    return serialize_practice(updated_practice)


@router.delete("/{practice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_practice(
    practice_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a practice platform."""
    try:
        oid = ObjectId(practice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid practice ID format")

    result = await db.practices.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Practice not found")

    return None


@router.put("/{practice_id}/stats", response_model=Practice)
async def update_practice_stats(
    practice_id: str,
    stats: PracticeStatsUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update practice platform statistics (problems solved, difficulty breakdown)."""
    try:
        oid = ObjectId(practice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid practice ID format")

    practice = await db.practices.find_one({"_id": oid})
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    # Update stats
    await db.practices.update_one(
        {"_id": oid},
        {
            "$set": {
                "problemsSolved": stats.problemsSolved,
                "easyCount": stats.easyCount,
                "mediumCount": stats.mediumCount,
                "hardCount": stats.hardCount,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    updated_practice = await db.practices.find_one({"_id": oid})
    return serialize_practice(updated_practice)
