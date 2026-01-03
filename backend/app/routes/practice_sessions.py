from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.practice_session import PracticeSession, PracticeSessionCreate, PracticeSessionUpdate
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_practice_session(session_doc: dict) -> dict:
    """Convert MongoDB document to PracticeSession model."""
    if session_doc and "_id" in session_doc:
        session_doc["id"] = str(session_doc["_id"])
        del session_doc["_id"]
    return session_doc


@router.get("/", response_model=List[PracticeSession])
async def list_practice_sessions(
    subject_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all practice sessions, optionally filtered by subject."""
    query = {}
    if subject_id:
        query["subjectId"] = subject_id

    sessions = await db.practice_sessions.find(query).sort("createdAt", -1).to_list(1000)
    return [serialize_practice_session(session) for session in sessions]


@router.post("/", response_model=PracticeSession, status_code=status.HTTP_201_CREATED)
async def create_practice_session(
    session: PracticeSessionCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new practice session."""
    session_dict = session.model_dump()
    session_dict["createdAt"] = datetime.utcnow()
    session_dict["updatedAt"] = datetime.utcnow()

    # Auto-calculate duration if startTime and endTime are provided
    if session_dict.get("startTime") and session_dict.get("endTime"):
        duration = (session_dict["endTime"] - session_dict["startTime"]).total_seconds()
        session_dict["duration"] = int(duration)

    result = await db.practice_sessions.insert_one(session_dict)
    created_session = await db.practice_sessions.find_one({"_id": result.inserted_id})

    return serialize_practice_session(created_session)


@router.get("/{session_id}", response_model=PracticeSession)
async def get_practice_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific practice session by ID."""
    try:
        session = await db.practice_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if not session:
        raise HTTPException(status_code=404, detail="Practice session not found")

    return serialize_practice_session(session)


@router.put("/{session_id}", response_model=PracticeSession)
async def update_practice_session(
    session_id: str,
    session_update: PracticeSessionUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing practice session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Check if session exists
    existing_session = await db.practice_sessions.find_one({"_id": oid})
    if not existing_session:
        raise HTTPException(status_code=404, detail="Practice session not found")

    # Update session
    update_dict = session_update.model_dump(exclude_unset=True, exclude={"createdAt"})
    update_dict["updatedAt"] = datetime.utcnow()

    # Auto-calculate duration if startTime and endTime are provided
    if "startTime" in update_dict and "endTime" in update_dict:
        if update_dict["startTime"] and update_dict["endTime"]:
            duration = (update_dict["endTime"] - update_dict["startTime"]).total_seconds()
            update_dict["duration"] = int(duration)

    await db.practice_sessions.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_session = await db.practice_sessions.find_one({"_id": oid})
    return serialize_practice_session(updated_session)


@router.patch("/{session_id}", response_model=PracticeSession)
async def partial_update_practice_session(
    session_id: str,
    session_update: dict,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Partially update a practice session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Check if session exists
    existing_session = await db.practice_sessions.find_one({"_id": oid})
    if not existing_session:
        raise HTTPException(status_code=404, detail="Practice session not found")

    if not session_update:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Don't allow updating id or createdAt
    session_update.pop("id", None)
    session_update.pop("createdAt", None)

    session_update["updatedAt"] = datetime.utcnow()

    await db.practice_sessions.update_one(
        {"_id": oid},
        {"$set": session_update}
    )

    updated_session = await db.practice_sessions.find_one({"_id": oid})
    return serialize_practice_session(updated_session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_practice_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a practice session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    result = await db.practice_sessions.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Practice session not found")

    return None


@router.get("/subject/{subject_id}/stats")
async def get_subject_practice_stats(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get practice statistics for a specific subject."""
    sessions = await db.practice_sessions.find({"subjectId": subject_id}).to_list(1000)

    if not sessions:
        return {
            "totalSessions": 0,
            "totalDuration": 0,
            "totalProblemsSolved": 0,
            "totalTasksCompleted": 0,
            "totalPagesRead": 0,
            "averageDuration": 0,
            "sessionsByType": {}
        }

    total_duration = sum(s.get("duration", 0) for s in sessions)
    total_problems = sum(s.get("problemsSolved", 0) for s in sessions)
    total_tasks = sum(s.get("tasksCompleted", 0) for s in sessions)
    total_pages = sum(s.get("pagesRead", 0) for s in sessions)

    # Group by practice type
    sessions_by_type = {}
    for session in sessions:
        practice_type = session.get("practiceType", "other")
        if practice_type not in sessions_by_type:
            sessions_by_type[practice_type] = 0
        sessions_by_type[practice_type] += 1

    return {
        "totalSessions": len(sessions),
        "totalDuration": total_duration,
        "totalProblemsSolved": total_problems,
        "totalTasksCompleted": total_tasks,
        "totalPagesRead": total_pages,
        "averageDuration": total_duration // len(sessions) if sessions else 0,
        "sessionsByType": sessions_by_type
    }
