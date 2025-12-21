from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.models.session import Session
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_session(session_doc: dict) -> dict:
    """Convert MongoDB document to Session model."""
    if session_doc and "_id" in session_doc:
        session_doc["id"] = str(session_doc["_id"])
        del session_doc["_id"]
    return session_doc


@router.get("/", response_model=List[Session])
async def list_sessions(
    type_filter: Optional[str] = Query(None),
    reference_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=1000),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get sessions with optional filters."""
    query = {}

    if type_filter:
        query["type"] = type_filter
    if reference_id:
        query["referenceId"] = reference_id
    if start_date or end_date:
        query["startTime"] = {}
        if start_date:
            query["startTime"]["$gte"] = start_date
        if end_date:
            query["startTime"]["$lte"] = end_date

    sessions = await db.sessions.find(query).sort("startTime", -1).limit(limit).to_list(limit)
    return [serialize_session(session) for session in sessions]


@router.post("/", response_model=Session, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: Session,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create/start a new session."""
    session_dict = session.model_dump(exclude={"id"})
    session_dict["createdAt"] = datetime.utcnow()

    # If endTime is not provided, session is ongoing
    if session_dict.get("endTime"):
        # Calculate duration
        start = session_dict["startTime"]
        end = session_dict["endTime"]
        session_dict["duration"] = int((end - start).total_seconds())

    result = await db.sessions.insert_one(session_dict)
    created_session = await db.sessions.find_one({"_id": result.inserted_id})

    return serialize_session(created_session)


@router.get("/active", response_model=Optional[Session])
async def get_active_session(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get currently active session (no endTime)."""
    session = await db.sessions.find_one(
        {"endTime": None},
        sort=[("startTime", -1)]
    )

    if not session:
        return None

    return serialize_session(session)


@router.get("/{session_id}", response_model=Session)
async def get_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific session by ID."""
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return serialize_session(session)


@router.put("/{session_id}", response_model=Session)
async def update_session(
    session_id: str,
    session_update: Session,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update/stop a session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Check if session exists
    existing_session = await db.sessions.find_one({"_id": oid})
    if not existing_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session
    update_dict = session_update.model_dump(exclude={"id", "createdAt"})

    # Recalculate duration if endTime is set
    if update_dict.get("endTime") and update_dict.get("startTime"):
        start = update_dict["startTime"]
        end = update_dict["endTime"]
        update_dict["duration"] = int((end - start).total_seconds())

    await db.sessions.update_one(
        {"_id": oid},
        {"$set": update_dict}
    )

    updated_session = await db.sessions.find_one({"_id": oid})
    return serialize_session(updated_session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    result = await db.sessions.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return None


@router.get("/stats/summary")
async def get_sessions_summary(
    reference_id: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get time statistics for sessions."""
    match_stage = {}
    if reference_id:
        match_stage = {"referenceId": reference_id}

    # Get today's stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_pipeline = [
        {"$match": {**match_stage, "startTime": {"$gte": today_start}}},
        {"$group": {"_id": None, "totalDuration": {"$sum": "$duration"}}}
    ]

    # Get this week's stats
    week_start = today_start - timedelta(days=today_start.weekday())
    week_pipeline = [
        {"$match": {**match_stage, "startTime": {"$gte": week_start}}},
        {"$group": {"_id": None, "totalDuration": {"$sum": "$duration"}}}
    ]

    # Get this month's stats
    month_start = today_start.replace(day=1)
    month_pipeline = [
        {"$match": {**match_stage, "startTime": {"$gte": month_start}}},
        {"$group": {"_id": None, "totalDuration": {"$sum": "$duration"}}}
    ]

    today_result = await db.sessions.aggregate(today_pipeline).to_list(1)
    week_result = await db.sessions.aggregate(week_pipeline).to_list(1)
    month_result = await db.sessions.aggregate(month_pipeline).to_list(1)

    return {
        "today": today_result[0]["totalDuration"] if today_result else 0,
        "thisWeek": week_result[0]["totalDuration"] if week_result else 0,
        "thisMonth": month_result[0]["totalDuration"] if month_result else 0
    }
