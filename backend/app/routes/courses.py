from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.models.course import Course, Subtopic
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_course(course_doc: dict) -> dict:
    """Convert MongoDB document to Course model."""
    if course_doc and "_id" in course_doc:
        course_doc["id"] = str(course_doc["_id"])
        del course_doc["_id"]
    return course_doc


@router.get("/", response_model=List[Course])
async def list_courses(
    status_filter: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all courses with optional status filter."""
    query = {}
    if status_filter:
        query["status"] = status_filter

    courses = await db.courses.find(query).sort("createdAt", -1).to_list(100)
    return [serialize_course(course) for course in courses]


@router.post("/", response_model=Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: Course,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new course."""
    course_dict = course.model_dump(exclude={"id"})
    course_dict["createdAt"] = datetime.utcnow()
    course_dict["updatedAt"] = datetime.utcnow()

    result = await db.courses.insert_one(course_dict)
    created_course = await db.courses.find_one({"_id": result.inserted_id})

    return serialize_course(created_course)


@router.get("/{course_id}", response_model=Course)
async def get_course(
    course_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific course by ID."""
    try:
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return serialize_course(course)


@router.put("/{course_id}", response_model=Course)
async def update_course(
    course_id: str,
    course_update: Course,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing course."""
    try:
        oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    # Check if course exists
    existing_course = await db.courses.find_one({"_id": oid})
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Update course
    update_dict = course_update.model_dump(exclude={"id", "createdAt"})
    update_dict["updatedAt"] = datetime.utcnow()

    await db.courses.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_course = await db.courses.find_one({"_id": oid})
    return serialize_course(updated_course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a course."""
    try:
        oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    result = await db.courses.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")

    return None


@router.post("/{course_id}/subtopics", response_model=Course)
async def add_subtopic(
    course_id: str,
    subtopic: Subtopic,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a subtopic to a course."""
    try:
        oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    course = await db.courses.find_one({"_id": oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Generate subtopic ID if not provided
    if not subtopic.id:
        subtopic.id = str(datetime.utcnow().timestamp())

    await db.courses.update_one(
        {"_id": oid},
        {
            "$push": {"subtopics": subtopic.model_dump()},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    updated_course = await db.courses.find_one({"_id": oid})
    return serialize_course(updated_course)


@router.put("/{course_id}/subtopics/{subtopic_id}", response_model=Course)
async def update_subtopic(
    course_id: str,
    subtopic_id: str,
    subtopic: Subtopic,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a subtopic in a course."""
    try:
        oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    result = await db.courses.update_one(
        {"_id": oid, "subtopics.id": subtopic_id},
        {
            "$set": {
                "subtopics.$": subtopic.model_dump(),
                "updatedAt": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course or subtopic not found")

    updated_course = await db.courses.find_one({"_id": oid})
    return serialize_course(updated_course)


@router.delete("/{course_id}/subtopics/{subtopic_id}", response_model=Course)
async def delete_subtopic(
    course_id: str,
    subtopic_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a subtopic from a course."""
    try:
        oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    result = await db.courses.update_one(
        {"_id": oid},
        {
            "$pull": {"subtopics": {"id": subtopic_id}},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course or subtopic not found")

    updated_course = await db.courses.find_one({"_id": oid})
    return serialize_course(updated_course)
