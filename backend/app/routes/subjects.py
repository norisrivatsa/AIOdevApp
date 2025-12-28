from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId
import secrets

from app.models.subject import Subject, Subtopic
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def generate_subject_id() -> str:
    """Generate a unique subject ID"""
    return f"subj_{secrets.token_urlsafe(8)}"


def serialize_subject(subject_doc: dict) -> dict:
    """Convert MongoDB document to Subject model."""
    if subject_doc and "_id" in subject_doc:
        subject_doc["id"] = str(subject_doc["_id"])
        del subject_doc["_id"]
    return subject_doc


@router.get("/", response_model=List[Subject])
async def list_subjects(
    status_filter: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all subjects with optional status filter."""
    query = {}
    if status_filter:
        query["status"] = status_filter

    subjects = await db.subjects.find(query).sort("createdAt", -1).to_list(100)
    return [serialize_subject(subject) for subject in subjects]


@router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject: Subject,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new subject."""
    subject_dict = subject.model_dump(exclude={"id"})
    subject_dict["subjectId"] = generate_subject_id()  # Generate custom ID
    subject_dict["createdAt"] = datetime.utcnow()
    subject_dict["updatedAt"] = datetime.utcnow()

    result = await db.subjects.insert_one(subject_dict)
    created_subject = await db.subjects.find_one({"_id": result.inserted_id})

    return serialize_subject(created_subject)


@router.get("/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific subject by ID."""
    try:
        subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    return serialize_subject(subject)


@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str,
    subject_update: Subject,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    # Check if subject exists
    existing_subject = await db.subjects.find_one({"_id": oid})
    if not existing_subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Update subject
    update_dict = subject_update.model_dump(exclude={"id", "createdAt"})
    update_dict["updatedAt"] = datetime.utcnow()

    await db.subjects.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_subject = await db.subjects.find_one({"_id": oid})
    return serialize_subject(updated_subject)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    result = await db.subjects.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")

    return None


@router.post("/{subject_id}/subtopics", response_model=Subject)
async def add_subtopic(
    subject_id: str,
    subtopic: Subtopic,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a subtopic to a subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    subject = await db.subjects.find_one({"_id": oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Generate subtopic ID if not provided
    if not subtopic.id:
        subtopic.id = str(datetime.utcnow().timestamp())

    await db.subjects.update_one(
        {"_id": oid},
        {
            "$push": {"subtopics": subtopic.model_dump()},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    updated_subject = await db.subjects.find_one({"_id": oid})
    return serialize_subject(updated_subject)


@router.put("/{subject_id}/subtopics/{subtopic_id}", response_model=Subject)
async def update_subtopic(
    subject_id: str,
    subtopic_id: str,
    subtopic: Subtopic,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a subtopic in a subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    result = await db.subjects.update_one(
        {"_id": oid, "subtopics.id": subtopic_id},
        {
            "$set": {
                "subtopics.$": subtopic.model_dump(),
                "updatedAt": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subject or subtopic not found")

    updated_subject = await db.subjects.find_one({"_id": oid})
    return serialize_subject(updated_subject)


@router.delete("/{subject_id}/subtopics/{subtopic_id}", response_model=Subject)
async def delete_subtopic(
    subject_id: str,
    subtopic_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a subtopic from a subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    result = await db.subjects.update_one(
        {"_id": oid},
        {
            "$pull": {"subtopics": {"id": subtopic_id}},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subject or subtopic not found")

    updated_subject = await db.subjects.find_one({"_id": oid})
    return serialize_subject(updated_subject)
