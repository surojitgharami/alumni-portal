from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from typing import List
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/activity", tags=["faculty-activity"])

@router.get("/feed")
async def get_department_activity_feed(current_user: dict = Depends(get_faculty_user)):
    """Get department activity feed"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    # Get recent activity from past 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    activities = []
    
    # Recent events
    recent_events = await db.events.find({
        "department": department,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", -1).to_list(20)
    
    for event in recent_events:
        activities.append({
            "type": "event_created",
            "title": f"Event: {event.get('title')}",
            "description": event.get("description", ""),
            "timestamp": event.get("created_at"),
            "created_by": event.get("created_by"),
            "status": event.get("approved", False) and "approved" or "pending",
            "icon": "calendar"
        })
    
    # Recent jobs
    recent_jobs = await db.jobs.find({
        "department": department,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", -1).to_list(20)
    
    for job in recent_jobs:
        activities.append({
            "type": "job_posted",
            "title": f"Job: {job.get('title')}",
            "description": job.get("description", ""),
            "timestamp": job.get("created_at"),
            "created_by": job.get("created_by"),
            "status": job.get("approved", False) and "approved" or "pending",
            "icon": "briefcase"
        })
    
    # Recent achievements
    recent_achievements = await db.achievements.find({
        "department": department,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", -1).to_list(10)
    
    for achievement in recent_achievements:
        activities.append({
            "type": "achievement_added",
            "title": f"Achievement: {achievement.get('title')}",
            "description": achievement.get("description", ""),
            "timestamp": achievement.get("created_at"),
            "created_by": achievement.get("created_by"),
            "status": "new",
            "icon": "trophy"
        })
    
    # Sort by timestamp descending
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:50]

@router.get("/stats")
async def get_department_stats(current_user: dict = Depends(get_faculty_user)):
    """Get department statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {}
    
    # Get counts
    events_count = await db.events.count_documents({"department": department})
    pending_events = await db.events.count_documents({"department": department, "approved": False})
    jobs_count = await db.jobs.count_documents({"department": department})
    pending_jobs = await db.jobs.count_documents({"department": department, "approved": False})
    alumni_count = await db.users.count_documents({"department": department, "role": "alumni"})
    achievements_count = await db.achievements.count_documents({"department": department})
    newsletters_count = await db.newsletter.count_documents({"department": department})
    
    return {
        "total_events": events_count,
        "pending_events": pending_events,
        "total_jobs": jobs_count,
        "pending_jobs": pending_jobs,
        "total_alumni": alumni_count,
        "total_achievements": achievements_count,
        "total_newsletters": newsletters_count,
        "verified_alumni": await db.users.count_documents({"department": department, "role": "alumni", "verified": True})
    }
