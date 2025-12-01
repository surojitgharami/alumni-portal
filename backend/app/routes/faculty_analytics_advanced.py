from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/analytics", tags=["faculty-analytics-advanced"])

@router.get("/events")
async def get_event_analytics(current_user: dict = Depends(get_faculty_user)):
    """Event participation statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {"total_events": 0, "total_registrations": 0, "top_events": []}
    
    events = await db.events.find({
        "department": department
    }).to_list(None)
    
    total_registrations = 0
    top_events = []
    
    for event in events:
        reg_count = event.get("registration_count", 0)
        total_registrations += reg_count
        top_events.append({
            "title": event.get("title"),
            "registrations": reg_count
        })
    
    top_events.sort(key=lambda x: x["registrations"], reverse=True)
    
    return {
        "total_events": len(events),
        "total_registrations": total_registrations,
        "top_events": top_events[:5]
    }

@router.get("/jobs")
async def get_job_analytics(current_user: dict = Depends(get_faculty_user)):
    """Job application statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {"total_jobs": 0, "total_applications": 0, "top_companies": []}
    
    jobs = await db.jobs.find({
        "department": department
    }).to_list(None)
    
    job_ids = [str(job["_id"]) for job in jobs]
    
    applications = await db.applications.find({
        "job_id": {"$in": job_ids}
    }).to_list(None)
    
    company_apps = {}
    for app in applications:
        company = "Unknown"
        company_apps[company] = company_apps.get(company, 0) + 1
    
    return {
        "total_jobs": len(jobs),
        "total_applications": len(applications),
        "top_companies": list(company_apps.items())[:5]
    }

@router.get("/newsletters")
async def get_newsletter_analytics(current_user: dict = Depends(get_faculty_user)):
    """Newsletter statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {"total_newsletters": 0, "published_this_month": 0}
    
    newsletters = await db.newsletter.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).to_list(None)
    
    month_start = datetime.now().replace(day=1)
    this_month = sum(1 for n in newsletters if n.get("created_at", datetime.min) >= month_start)
    
    return {
        "total_newsletters": len(newsletters),
        "published_this_month": this_month
    }

@router.get("/achievements")
async def get_achievement_analytics(current_user: dict = Depends(get_faculty_user)):
    """Achievement statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {"total_achievements": 0, "monthly_trend": []}
    
    achievements = await db.achievements.find({
        "department": department
    }).to_list(None)
    
    return {
        "total_achievements": len(achievements),
        "monthly_trend": []
    }

@router.get("/engagement")
async def get_engagement_analytics(current_user: dict = Depends(get_faculty_user)):
    """Overall engagement metrics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return {
            "active_students": 0,
            "active_alumni": 0,
            "engagement_score": 0
        }
    
    students = await db.users.find({
        "role": "student",
        "department": department
    }).to_list(None)
    
    alumni = await db.users.find({
        "role": "alumni",
        "department": department
    }).to_list(None)
    
    return {
        "active_students": len(students),
        "active_alumni": len(alumni),
        "engagement_score": min(100, (len(students) + len(alumni)) * 10)
    }
