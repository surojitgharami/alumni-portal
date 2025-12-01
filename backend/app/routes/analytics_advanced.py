"""Advanced analytics: event/job conversion, faculty performance"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/analytics/advanced", tags=["analytics-advanced"])

@router.get("/event-conversion")
async def event_conversion_tracking(current_user: dict = Depends(get_current_user)):
    """Track event registration conversion"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Get all events
        events = await db.events.find({}).to_list(None)
        
        total_events = len(events)
        total_registrations = sum(e.get("registration_count", 0) for e in events)
        
        # Calculate conversion (registrations per event)
        conversion_rate = (total_registrations / max(total_events, 1)) * 100
        
        return {
            "total_events": total_events,
            "total_registrations": total_registrations,
            "avg_registrations_per_event": total_registrations / max(total_events, 1),
            "conversion_rate": f"{conversion_rate:.1f}%"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating conversion: {str(e)}")

@router.get("/job-conversion")
async def job_conversion_tracking(current_user: dict = Depends(get_current_user)):
    """Track job application conversion: views → apply → shortlist"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        jobs = await db.jobs.find({}).to_list(None)
        applications = await db.applications.find({}).to_list(None)
        
        total_jobs = len(jobs)
        total_applications = len(applications)
        shortlisted = sum(1 for a in applications if a.get("status") == "shortlisted")
        
        # Conversion rates
        app_rate = (total_applications / max(sum(j.get("views", 1) for j in jobs), 1)) * 100
        shortlist_rate = (shortlisted / max(total_applications, 1)) * 100
        
        return {
            "total_jobs": total_jobs,
            "total_applications": total_applications,
            "shortlisted": shortlisted,
            "application_rate": f"{app_rate:.1f}%",
            "shortlist_rate": f"{shortlist_rate:.1f}%"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating conversion: {str(e)}")

@router.get("/engagement-metrics")
async def engagement_metrics(current_user: dict = Depends(get_current_user)):
    """Alumni engagement metrics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Active alumni in last 30 days
        last_month = datetime.utcnow() - timedelta(days=30)
        active_alumni = await db.users.count_documents({
            "role": "alumni",
            "last_login": {"$gte": last_month}
        })
        
        # Total alumni
        total_alumni = await db.users.count_documents({"role": "alumni"})
        
        # Newsletter subscribers
        newsletter_subs = await db.newsletter_subscriptions.count_documents(
            {"subscribed": True}
        )
        
        return {
            "total_alumni": total_alumni,
            "active_alumni_30d": active_alumni,
            "engagement_rate": f"{(active_alumni / max(total_alumni, 1) * 100):.1f}%",
            "newsletter_subscribers": newsletter_subs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")

@router.get("/faculty-performance")
async def faculty_performance(current_user: dict = Depends(get_current_user)):
    """Faculty performance analytics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        faculty_list = await db.users.find({"role": "faculty"}).to_list(None)
        
        performance = []
        for faculty in faculty_list:
            faculty_id = str(faculty["_id"])
            
            events_created = await db.events.count_documents({"created_by": faculty_id})
            jobs_posted = await db.jobs.count_documents({"created_by": faculty_id})
            newsletters = await db.newsletter.count_documents({"created_by": faculty_id})
            
            performance.append({
                "faculty_name": faculty.get("name"),
                "email": faculty.get("email"),
                "events_created": events_created,
                "jobs_posted": jobs_posted,
                "newsletters_published": newsletters,
                "total_activity": events_created + jobs_posted + newsletters
            })
        
        # Sort by activity
        performance.sort(key=lambda x: x["total_activity"], reverse=True)
        
        return {
            "faculty_performance": performance[:10],  # Top 10
            "total_faculty": len(faculty_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance: {str(e)}")
