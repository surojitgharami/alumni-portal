from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/jobs", tags=["faculty-jobs"])


class JobCreateRequest(BaseModel):
    title: str
    company: str
    description: str
    location: str
    job_type: str = "full-time"
    salary_range: Optional[str] = None


@router.get("")
async def list_faculty_jobs(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_faculty_user)
):
    """List jobs for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    query = {"department": department}
    if status_filter:
        query["status"] = status_filter
    
    jobs = await db.jobs.find(query).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(j["_id"]),
            "title": j.get("title"),
            "company": j.get("company"),
            "description": j.get("description"),
            "location": j.get("location"),
            "job_type": j.get("job_type"),
            "status": j.get("status", "pending"),
            "approved": j.get("approved", False),
            "created_at": j.get("created_at")
        }
        for j in jobs
    ]


@router.post("")
async def create_faculty_job(
    request: JobCreateRequest,
    current_user: dict = Depends(get_faculty_user)
):
    """Create job for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    
    job = {
        "title": request.title,
        "company": request.company,
        "description": request.description,
        "location": request.location,
        "job_type": request.job_type,
        "salary_range": request.salary_range,
        "department": department,
        "created_by": ObjectId(str(current_user["_id"])),
        "created_by_role": "faculty",
        "status": "pending",
        "approved": False,
        "applications": [],
        "created_at": datetime.utcnow()
    }
    
    result = await db.jobs.insert_one(job)
    
    return {
        "id": str(result.inserted_id),
        "message": "Job posted and pending admin approval"
    }


@router.post("/{job_id}/approve")
async def approve_job(
    job_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Faculty approves job in their department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Can only approve jobs in your department")
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "approved", "approved": True}}
    )
    
    return {"message": "Job approved"}


@router.post("/{job_id}/reject")
async def reject_job(
    job_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Faculty rejects job in their department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Can only reject jobs in your department")
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Job rejected"}
