from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
from ..models import JobApplicationResponse
from ..db import get_database
from ..deps import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/jobs/{job_id}")
async def apply_for_job(
    job_id: str,
    cover_letter: str = "",
    current_user = Depends(get_current_user)
):
    """Apply for a job"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    # Check if user has membership
    is_faculty = current_user.get("role") == "faculty"
    if not is_faculty and current_user.get("membership_status") != "active":
        raise HTTPException(status_code=403, detail="Membership required to apply for jobs")

    # Check if already applied
    existing = await db.job_applications.find_one({
        "job_id": job_id,
        "user_id": str(current_user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied for this job")

    # Create application
    application = {
        "job_id": job_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "user_email": current_user["email"],
        "cover_letter": cover_letter,
        "status": "applied",
        "applied_at": datetime.utcnow()
    }

    result = await db.job_applications.insert_one(application)

    return JobApplicationResponse(
        id=str(result.inserted_id),
        job_id=job_id,
        user_id=str(current_user["_id"]),
        user_name=current_user["name"],
        user_email=current_user["email"],
        resume_url=None,
        cover_letter=cover_letter,
        status="applied",
        applied_at=datetime.utcnow()
    )


@router.get("/my-applications", response_model=list[JobApplicationResponse])
async def get_my_applications(
    current_user = Depends(get_current_user)
):
    """Get user's job applications"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    applications = await db.job_applications.find({
        "user_id": str(current_user["_id"])
    }).sort("applied_at", -1).to_list(None)

    return [
        JobApplicationResponse(
            id=str(a["_id"]),
            job_id=a["job_id"],
            user_id=a["user_id"],
            user_name=a["user_name"],
            user_email=a["user_email"],
            resume_url=a.get("resume_url"),
            cover_letter=a.get("cover_letter"),
            status=a["status"],
            applied_at=a["applied_at"]
        )
        for a in applications
    ]


@router.get("/job/{job_id}/applicants")
async def get_job_applicants(
    job_id: str,
    current_user = Depends(get_current_user)
):
    """Get applicants for a job (job poster only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    # Check if current user is job poster
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job or job["created_by"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    applications = await db.job_applications.find({
        "job_id": job_id
    }).sort("applied_at", -1).to_list(None)

    return [
        {
            "id": str(a["_id"]),
            "user_name": a["user_name"],
            "user_email": a["user_email"],
            "status": a["status"],
            "cover_letter": a.get("cover_letter"),
            "applied_at": a["applied_at"]
        }
        for a in applications
    ]


@router.put("/{application_id}/status")
async def update_application_status(
    application_id: str,
    new_status: str,
    current_user = Depends(get_current_user)
):
    """Update application status (employer only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if new_status not in ["applied", "shortlisted", "rejected", "selected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    if not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")

    app = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job = await db.jobs.find_one({"_id": ObjectId(app["job_id"])})
    if job["created_by"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.job_applications.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": new_status}}
    )

    return {"status": "updated"}
