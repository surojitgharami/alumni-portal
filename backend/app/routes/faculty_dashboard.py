from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/dashboard")
async def get_faculty_dashboard(
    current_user: dict = Depends(get_faculty_user)
):
    """Get faculty dashboard stats"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department: str = current_user.get("department", "")
    
    # Get stats for faculty's department
    events_count = await db.events.count_documents({"department": department})
    jobs_count = await db.jobs.count_documents({"department": department})
    alumni_count = await db.users.count_documents({"department": department, "role": "alumni"})
    students_count = await db.users.count_documents({"department": department, "role": "student"})
    
    # Get pending approvals
    pending_events = await db.events.count_documents({"department": department, "status": "pending"})
    pending_jobs = await db.jobs.count_documents({"department": department, "status": "pending"})
    
    return {
        "department": department,
        "stats": {
            "total_events": events_count,
            "pending_events": pending_events,
            "total_jobs": jobs_count,
            "pending_jobs": pending_jobs,
            "total_alumni": alumni_count,
            "total_students": students_count
        },
        "last_updated": datetime.utcnow()
    }


@router.get("/events")
async def get_faculty_events(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_faculty_user)
):
    """Get events for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department: str = current_user.get("department", "")
    query = {"department": department}
    
    if status_filter:
        query["status"] = status_filter
    
    events = await db.events.find(query).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(e["_id"]),
            "title": e.get("title"),
            "description": e.get("description"),
            "event_date": e.get("event_date"),
            "status": e.get("status", "pending"),
            "created_at": e.get("created_at")
        }
        for e in events
    ]


class AlumniCreateRequest(BaseModel):
    name: str
    email: str
    passout_year: int
    current_company: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class AlumniUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    passout_year: Optional[int] = None
    current_company: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

@router.get("/alumni")
async def get_faculty_alumni(
    department: Optional[str] = None,
    current_user: dict = Depends(get_faculty_user)
):
    """Get alumni for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    dept = department or current_user.get("department")
    if not dept:
        return []
    
    alumni = await db.users.find({"department": dept, "role": "alumni"}).sort("name", 1).to_list(None)
    
    return [
        {
            "id": str(a["_id"]),
            "name": a.get("name"),
            "email": a.get("email"),
            "phone": a.get("phone", ""),
            "passout_year": a.get("passout_year"),
            "current_company": a.get("current_company", ""),
            "location": a.get("location", ""),
            "is_blocked": a.get("is_blocked", False),
            "status": a.get("status", "active")
        }
        for a in alumni
    ]


@router.post("/alumni")
async def create_faculty_alumni(
    request: AlumniCreateRequest,
    current_user: dict = Depends(get_faculty_user)
):
    """Add new alumni to department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    from ..core.security import hash_password
    alumni_doc = {
        "name": request.name,
        "email": request.email,
        "phone": request.phone or "",
        "passout_year": request.passout_year,
        "current_company": request.current_company or "",
        "location": request.location or "",
        "department": department,
        "role": "alumni",
        "status": "active",
        "password_hash": hash_password("defaultpassword123"),
        "membership_status": "unpaid",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(alumni_doc)
    return {"id": str(result.inserted_id), "message": "Alumni added successfully"}


@router.patch("/alumni/{alumni_id}")
async def update_faculty_alumni(
    alumni_id: str,
    request: AlumniUpdateRequest,
    current_user: dict = Depends(get_faculty_user)
):
    """Edit alumni details"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        alumni = await db.users.find_one({"_id": ObjectId(alumni_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid alumni ID")
    
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    # Check permissions
    if alumni.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    update_data = {}
    if request.name:
        update_data["name"] = request.name
    if request.email:
        # Check if new email exists
        existing = await db.users.find_one({"email": request.email, "_id": {"$ne": ObjectId(alumni_id)}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        update_data["email"] = request.email
    if request.passout_year:
        update_data["passout_year"] = request.passout_year
    if request.current_company is not None:
        update_data["current_company"] = request.current_company
    if request.phone is not None:
        update_data["phone"] = request.phone
    if request.location is not None:
        update_data["location"] = request.location
    
    await db.users.update_one({"_id": ObjectId(alumni_id)}, {"$set": update_data})
    return {"message": "Alumni updated successfully"}


@router.delete("/alumni/{alumni_id}")
async def delete_faculty_alumni(
    alumni_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Delete alumni"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        alumni = await db.users.find_one({"_id": ObjectId(alumni_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid alumni ID")
    
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    # Check permissions
    if alumni.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.users.delete_one({"_id": ObjectId(alumni_id)})
    return {"message": "Alumni deleted successfully"}


@router.post("/alumni/{alumni_id}/approve")
async def approve_faculty_alumni(
    alumni_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Approve pending alumni registration"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        alumni = await db.users.find_one({"_id": ObjectId(alumni_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid alumni ID")
    
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    # Check permissions
    if alumni.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.users.update_one(
        {"_id": ObjectId(alumni_id)},
        {"$set": {"status": "active", "approved_at": datetime.utcnow()}}
    )
    return {"message": "Alumni approved successfully"}
