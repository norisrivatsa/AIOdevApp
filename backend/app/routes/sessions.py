from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.models.session import Session, generate_session_id
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


def serialize_session(session_doc: dict) -> dict:
    """Convert MongoDB document to Session model."""
    if session_doc and "_id" in session_doc:
        session_doc["id"] = str(session_doc["_id"])
        del session_doc["_id"]

    # Backwards compatibility: handle old 'type' field
    if "type" in session_doc and "referenceType" not in session_doc:
        session_doc["referenceType"] = session_doc["type"]

    # Default sessionType if not present
    if "sessionType" not in session_doc:
        session_doc["sessionType"] = "study"

    # Ensure date field exists
    if "date" not in session_doc and "startTime" in session_doc:
        session_doc["date"] = session_doc["startTime"]

    # Default name if not present
    if "name" not in session_doc:
        session_doc["name"] = "Unknown"

    return session_doc


@router.get("/", response_model=List[Session])
async def list_sessions(
    type_filter: Optional[str] = Query(None, description="Filter by referenceType (subject/project/practice_platform)"),
    reference_id: Optional[str] = Query(None, description="Filter by referenceId"),
    session_type: Optional[str] = Query(None, description="Filter by sessionType (study/practice)"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=1000),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get sessions with optional filters."""
    query = {}

    if type_filter:
        # Support both old 'type' field and new 'referenceType' field
        query["$or"] = [
            {"referenceType": type_filter},
            {"type": type_filter}  # Backwards compatibility
        ]
    if reference_id:
        query["referenceId"] = reference_id
    if session_type:
        query["sessionType"] = session_type
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

    # Generate custom uniqueId if not provided
    if not session_dict.get("uniqueId"):
        session_dict["uniqueId"] = generate_session_id(
            session_dict.get("referenceType", "subject"),
            session_dict.get("name", "Unknown")
        )

    # Set date to start of startTime date if not provided
    if not session_dict.get("date"):
        start_time = session_dict.get("startTime", datetime.utcnow())
        session_dict["date"] = start_time.replace(hour=0, minute=0, second=0, microsecond=0)

    # If endTime is not provided, session is ongoing
    if session_dict.get("endTime"):
        # Calculate duration in MINUTES
        start = session_dict["startTime"]
        end = session_dict["endTime"]
        duration_seconds = (end - start).total_seconds()
        session_dict["duration"] = int(duration_seconds / 60)  # Convert to minutes

    result = await db.sessions.insert_one(session_dict)
    created_session = await db.sessions.find_one({"_id": result.inserted_id})

    # Add session ID to subject/project for backup/cross-checking
    session_id = str(result.inserted_id)
    reference_type = session_dict.get("referenceType")
    reference_id = session_dict.get("referenceId")

    try:
        if reference_type == "subject":
            await db.subjects.update_one(
                {"id": reference_id},
                {"$addToSet": {"sessions": session_id}}  # addToSet prevents duplicates
            )
        elif reference_type == "project":
            await db.projects.update_one(
                {"id": reference_id},
                {"$addToSet": {"sessions": session_id}}
            )
    except Exception as e:
        # Log but don't fail the session creation
        print(f"Warning: Failed to link session to {reference_type}: {e}")

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

    # Generate uniqueId if not present
    if not update_dict.get("uniqueId") and not existing_session.get("uniqueId"):
        update_dict["uniqueId"] = generate_session_id(
            update_dict.get("referenceType", existing_session.get("referenceType", "subject")),
            update_dict.get("name", existing_session.get("name", "Unknown"))
        )

    # Recalculate duration in MINUTES if endTime is set
    if update_dict.get("endTime") and update_dict.get("startTime"):
        start = update_dict["startTime"]
        end = update_dict["endTime"]
        duration_seconds = (end - start).total_seconds()
        update_dict["duration"] = int(duration_seconds / 60)  # Convert to minutes

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
