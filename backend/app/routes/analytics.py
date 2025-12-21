from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


@router.get("/time-summary")
async def get_time_summary(
    period: str = Query("week", regex="^(day|week|month)$"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get time summary for a specific period.
    Period can be: day, week, month
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "day":
        start_date = today_start
    elif period == "week":
        start_date = today_start - timedelta(days=today_start.weekday())
    else:  # month
        start_date = today_start.replace(day=1)

    # Aggregate total time
    pipeline = [
        {"$match": {"startTime": {"$gte": start_date}}},
        {"$group": {
            "_id": None,
            "totalDuration": {"$sum": "$duration"},
            "sessionCount": {"$sum": 1}
        }}
    ]

    result = await db.sessions.aggregate(pipeline).to_list(1)

    if result:
        return {
            "period": period,
            "startDate": start_date.isoformat(),
            "totalDuration": result[0]["totalDuration"],
            "totalHours": round(result[0]["totalDuration"] / 3600, 2),
            "sessionCount": result[0]["sessionCount"]
        }

    return {
        "period": period,
        "startDate": start_date.isoformat(),
        "totalDuration": 0,
        "totalHours": 0.0,
        "sessionCount": 0
    }


@router.get("/distribution")
async def get_time_distribution(
    days: int = Query(30, ge=1, le=365),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get time distribution by type (course vs project) over specified days."""
    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"startTime": {"$gte": start_date}}},
        {"$group": {
            "_id": "$type",
            "totalDuration": {"$sum": "$duration"},
            "sessionCount": {"$sum": 1}
        }}
    ]

    results = await db.sessions.aggregate(pipeline).to_list(10)

    distribution = {
        "course": {"duration": 0, "hours": 0.0, "count": 0},
        "project": {"duration": 0, "hours": 0.0, "count": 0}
    }

    for item in results:
        session_type = item["_id"]
        if session_type in distribution:
            distribution[session_type] = {
                "duration": item["totalDuration"],
                "hours": round(item["totalDuration"] / 3600, 2),
                "count": item["sessionCount"]
            }

    return {
        "days": days,
        "distribution": distribution
    }


@router.get("/streaks")
async def calculate_streaks(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Calculate current learning streak (consecutive days with sessions)."""
    # Get all unique dates with sessions, sorted descending
    pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$startTime"
                    }
                }
            }
        },
        {"$sort": {"_id": -1}}
    ]

    dates = await db.sessions.aggregate(pipeline).to_list(365)

    if not dates:
        return {
            "currentStreak": 0,
            "longestStreak": 0,
            "lastActivityDate": None
        }

    # Convert to datetime objects
    activity_dates = [
        datetime.strptime(d["_id"], "%Y-%m-%d").date()
        for d in dates
    ]

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    # Calculate current streak
    current_streak = 0
    if activity_dates[0] == today or activity_dates[0] == yesterday:
        current_streak = 1
        check_date = activity_dates[0] - timedelta(days=1)

        for date in activity_dates[1:]:
            if date == check_date:
                current_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1

    for i in range(1, len(activity_dates)):
        if (activity_dates[i-1] - activity_dates[i]).days == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1

    longest_streak = max(longest_streak, temp_streak) if activity_dates else 0

    return {
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "lastActivityDate": activity_dates[0].isoformat() if activity_dates else None
    }


@router.get("/progress")
async def get_overall_progress(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get overall progress metrics."""
    # Count courses by status
    course_pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]

    # Count projects by status
    project_pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]

    # Total time logged
    time_pipeline = [
        {"$group": {
            "_id": None,
            "totalDuration": {"$sum": "$duration"}
        }}
    ]

    courses = await db.courses.aggregate(course_pipeline).to_list(10)
    projects = await db.projects.aggregate(project_pipeline).to_list(10)
    time_result = await db.sessions.aggregate(time_pipeline).to_list(1)

    # Count completed subtopics
    completed_subtopics_pipeline = [
        {"$unwind": "$subtopics"},
        {"$match": {"subtopics.completed": True}},
        {"$count": "total"}
    ]

    total_subtopics_pipeline = [
        {"$unwind": "$subtopics"},
        {"$count": "total"}
    ]

    completed_subtopics = await db.courses.aggregate(completed_subtopics_pipeline).to_list(1)
    total_subtopics = await db.courses.aggregate(total_subtopics_pipeline).to_list(1)

    # Format course stats
    course_stats = {
        "not_started": 0,
        "in_progress": 0,
        "completed": 0,
        "on_hold": 0
    }
    for item in courses:
        course_stats[item["_id"]] = item["count"]

    # Format project stats
    project_stats = {
        "planning": 0,
        "active": 0,
        "completed": 0,
        "archived": 0
    }
    for item in projects:
        project_stats[item["_id"]] = item["count"]

    return {
        "courses": course_stats,
        "projects": project_stats,
        "totalTimeLogged": time_result[0]["totalDuration"] if time_result else 0,
        "totalHoursLogged": round((time_result[0]["totalDuration"] if time_result else 0) / 3600, 2),
        "completedSubtopics": completed_subtopics[0]["total"] if completed_subtopics else 0,
        "totalSubtopics": total_subtopics[0]["total"] if total_subtopics else 0
    }


@router.get("/daily-activity")
async def get_daily_activity(
    days: int = Query(30, ge=1, le=365),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get daily activity for calendar heatmap."""
    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"startTime": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$startTime"
                    }
                },
                "duration": {"$sum": "$duration"},
                "sessionCount": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    results = await db.sessions.aggregate(pipeline).to_list(365)

    activity = [
        {
            "date": item["_id"],
            "duration": item["duration"],
            "hours": round(item["duration"] / 3600, 2),
            "sessionCount": item["sessionCount"]
        }
        for item in results
    ]

    return {
        "days": days,
        "activity": activity
    }
