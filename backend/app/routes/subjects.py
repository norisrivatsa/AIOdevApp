from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
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


def calculate_subtopic_completion(subtopic: dict) -> float:
    """
    Calculate completion percentage for a subtopic using weighted depth algorithm.
    Works with nested subtopic structure.
    Returns percentage (0-100).
    """
    # Leaf node (no nested subtopics)
    if not subtopic.get("subtopics") or len(subtopic["subtopics"]) == 0:
        return 100.0 if subtopic.get("status") == "completed" else 0.0

    # Parent node - calculate average of all nested subtopics
    child_completions = []
    for child_subtopic in subtopic["subtopics"]:
        child_completion = calculate_subtopic_completion(child_subtopic)
        child_completions.append(child_completion)

    if not child_completions:
        return 100.0 if subtopic.get("status") == "completed" else 0.0

    average = sum(child_completions) / len(child_completions)
    return round(average, 2)


def count_subtopics_recursive(subtopics: List[dict]) -> tuple:
    """
    Recursively count total and completed subtopics.
    Returns (total_count, completed_count)
    """
    total = 0
    completed = 0

    for subtopic in subtopics:
        total += 1
        if subtopic.get("status") == "completed":
            completed += 1

        # Recursively count nested subtopics
        if subtopic.get("subtopics"):
            nested_total, nested_completed = count_subtopics_recursive(subtopic["subtopics"])
            total += nested_total
            completed += nested_completed

    return total, completed


def get_level_stats_recursive(subtopics: List[dict], level: int = 0, stats: dict = None) -> dict:
    """
    Recursively calculate stats by level.
    Returns dict with level stats.
    """
    if stats is None:
        stats = {}

    for subtopic in subtopics:
        if level not in stats:
            stats[level] = {"total": 0, "completed": 0}

        stats[level]["total"] += 1
        if subtopic.get("status") == "completed":
            stats[level]["completed"] += 1

        # Recursively process nested subtopics
        if subtopic.get("subtopics"):
            get_level_stats_recursive(subtopic["subtopics"], level + 1, stats)

    return stats


def calculate_subject_completion(subtopics: List[dict]) -> Dict[str, Any]:
    """
    Calculate overall subject completion statistics for nested structure.
    Returns dict with completion percentage, counts, and level stats.
    """
    if not subtopics:
        return {
            "completionPercentage": 0.0,
            "completedSubtopicsCount": 0,
            "totalSubtopicsCount": 0,
            "levelStats": []
        }

    # Calculate completion for each root topic
    root_completions = []
    for root in subtopics:
        completion = calculate_subtopic_completion(root)
        root_completions.append(completion)

    # Overall completion = average of root topics
    overall_completion = sum(root_completions) / len(root_completions) if root_completions else 0.0

    # Count total and completed subtopics recursively
    total_count, completed_count = count_subtopics_recursive(subtopics)

    # Calculate stats by level
    level_stats = get_level_stats_recursive(subtopics)
    level_stats_list = [
        {
            "level": level,
            "total": stats["total"],
            "completed": stats["completed"],
            "percentage": round((stats["completed"] / stats["total"]) * 100, 2) if stats["total"] > 0 else 0.0
        }
        for level, stats in sorted(level_stats.items())
    ]

    return {
        "completionPercentage": round(overall_completion, 2),
        "completedSubtopicsCount": completed_count,
        "totalSubtopicsCount": total_count,
        "levelStats": level_stats_list
    }


def update_subtopic_cached_completions(subtopics: List[dict]) -> List[dict]:
    """
    Recursively update cachedCompletion for all subtopics in nested structure.
    Returns updated subtopics list.
    """
    updated_subtopics = []
    for subtopic in subtopics:
        updated_subtopic = subtopic.copy()
        updated_subtopic["cachedCompletion"] = calculate_subtopic_completion(subtopic)

        # Recursively update nested subtopics
        if subtopic.get("subtopics"):
            updated_subtopic["subtopics"] = update_subtopic_cached_completions(subtopic["subtopics"])

        updated_subtopics.append(updated_subtopic)

    return updated_subtopics


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
    """Update an existing subject with full data."""
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


@router.patch("/{subject_id}", response_model=Subject)
async def partial_update_subject(
    subject_id: str,
    subject_update: dict,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Partially update an existing subject."""
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    # Check if subject exists
    existing_subject = await db.subjects.find_one({"_id": oid})
    if not existing_subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Only update fields that are provided
    if not subject_update:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Don't allow updating id or createdAt
    subject_update.pop("id", None)
    subject_update.pop("createdAt", None)

    subject_update["updatedAt"] = datetime.utcnow()

    await db.subjects.update_one(
        {"_id": oid},
        {"$set": subject_update}
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


def find_and_toggle_subtopic(subtopics: List[dict], subtopic_id: str) -> bool:
    """
    Recursively find and toggle a subtopic by ID in nested structure.
    Returns True if found and toggled, False otherwise.
    """
    for subtopic in subtopics:
        if subtopic["id"] == subtopic_id:
            # Toggle status
            current_status = subtopic.get("status", "active")
            subtopic["status"] = "completed" if current_status == "active" else "active"
            subtopic["completedDate"] = datetime.utcnow() if subtopic["status"] == "completed" else None
            return True

        # Recursively search in nested subtopics
        if subtopic.get("subtopics"):
            if find_and_toggle_subtopic(subtopic["subtopics"], subtopic_id):
                return True

    return False


@router.put("/{subject_id}/subtopics/{subtopic_id}/toggle", response_model=Subject)
async def toggle_subtopic_completion(
    subject_id: str,
    subtopic_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Toggle the completion status of a subtopic and recalculate all completion percentages.
    Works with nested subtopic structure.
    """
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    # Get the subject
    subject = await db.subjects.find_one({"_id": oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Get subtopics
    subtopics = subject.get("subtopics", [])
    if not subtopics:
        raise HTTPException(status_code=404, detail="No subtopics found")

    # Find and toggle the target subtopic recursively
    subtopic_found = find_and_toggle_subtopic(subtopics, subtopic_id)

    if not subtopic_found:
        raise HTTPException(status_code=404, detail="Subtopic not found")

    # Recalculate all cached completions
    updated_subtopics = update_subtopic_cached_completions(subtopics)

    # Calculate subject-level completion stats
    completion_stats = calculate_subject_completion(updated_subtopics)

    # Update the subject with new data
    await db.subjects.update_one(
        {"_id": oid},
        {
            "$set": {
                "subtopics": updated_subtopics,
                "completionPercentage": completion_stats["completionPercentage"],
                "progress": completion_stats["completionPercentage"],  # Keep in sync
                "completedSubtopicsCount": completion_stats["completedSubtopicsCount"],
                "totalSubtopicsCount": completion_stats["totalSubtopicsCount"],
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # Return updated subject
    updated_subject = await db.subjects.find_one({"_id": oid})
    return serialize_subject(updated_subject)


def find_next_uncompleted_subtopic(subtopics: List[dict], level: int = 0) -> dict:
    """
    Recursively find the first uncompleted leaf subtopic.
    Returns subtopic dict or None if all completed.
    """
    # Sort by order
    sorted_subtopics = sorted(subtopics, key=lambda x: x.get("order", 0))

    for subtopic in sorted_subtopics:
        # Check if it's a leaf node (no nested subtopics) and not completed
        has_nested = subtopic.get("subtopics") and len(subtopic["subtopics"]) > 0

        if not has_nested and subtopic.get("status") != "completed":
            return {
                "id": subtopic["id"],
                "name": subtopic["name"],
                "level": level
            }

        # If has nested subtopics, search recursively
        if has_nested:
            nested_result = find_next_uncompleted_subtopic(subtopic["subtopics"], level + 1)
            if nested_result:
                return nested_result

    return None


@router.get("/{subject_id}/progress")
async def get_subject_progress(
    subject_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get detailed progress statistics for a subject with nested structure.
    Returns completion percentage, counts, level breakdowns, and next recommended subtopic.
    """
    try:
        oid = ObjectId(subject_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    subject = await db.subjects.find_one({"_id": oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subtopics = subject.get("subtopics", [])

    # Calculate completion stats
    completion_stats = calculate_subject_completion(subtopics)

    # Find next recommended subtopic (first uncompleted leaf node)
    next_subtopic = find_next_uncompleted_subtopic(subtopics)

    # Calculate remaining count
    remaining_count = completion_stats["totalSubtopicsCount"] - completion_stats["completedSubtopicsCount"]

    return {
        "overallProgress": completion_stats["completionPercentage"],
        "completedCount": completion_stats["completedSubtopicsCount"],
        "totalCount": completion_stats["totalSubtopicsCount"],
        "remainingCount": remaining_count,
        "levelStats": completion_stats["levelStats"],
        "nextRecommendedSubtopic": next_subtopic
    }
