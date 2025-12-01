from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from ..models import JobCreate, JobResponse
from ..crud import create_job, get_jobs, get_job_by_id, get_user_by_id
from ..deps import get_current_user, get_alumni_with_membership

router = APIRouter(prefix="/jobs", tags=["Jobs"])


async def job_to_response(job: dict) -> JobResponse:
    creator = await get_user_by_id(str(job["created_by"]))
    creator_name = creator.get("name") if creator else None
    
    return JobResponse(
        id=str(job["_id"]),
        title=job["title"],
        company=job["company"],
        description=job["description"],
        location=job["location"],
        job_type=job["job_type"],
        salary_range=job.get("salary_range"),
        application_link=job.get("application_link"),
        created_by=str(job["created_by"]),
        created_by_name=creator_name,
        approved=job["approved"],
        created_at=job["created_at"]
    )


@router.get("", response_model=List[JobResponse])
async def list_jobs(user: dict = Depends(get_current_user)):
    jobs = await get_jobs(approved_only=True)
    return [await job_to_response(j) for j in jobs]


@router.get("/all", response_model=List[JobResponse])
async def list_all_jobs(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    jobs = await get_jobs(approved_only=False)
    return [await job_to_response(j) for j in jobs]


@router.post("", response_model=JobResponse)
async def create_new_job(
    request: JobCreate,
    user: dict = Depends(get_alumni_with_membership)
):
    if user.get("role") == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot post jobs. Only alumni with active membership can post jobs."
        )
    
    job = await create_job(request.model_dump(), str(user["_id"]))
    
    # Send job posting notification to all alumni if job is approved
    if job.get("approved"):
        from ..services.email_service import send_email
        from ..db import get_database
        
        db = get_database()
        if db is not None:
            # Get all alumni with email
            alumni = await db.users.find({"role": {"$in": ["alumni", "student"]}}).to_list(None)
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>New Job Opportunity! 💼</h2>
                    <p>Hi,</p>
                    <p>A new job has been posted on our portal:</p>
                    <p><strong>{job['title']}</strong> at <strong>{job['company']}</strong></p>
                    <p><strong>Location:</strong> {job.get('location', 'TBD')}</p>
                    <p><strong>Type:</strong> {job.get('job_type', 'TBD')}</p>
                    <p>{job['description']}</p>
                    <p>Log in to your dashboard to view details and apply.</p>
                    <p>Best regards,<br>Alumni Portal Team</p>
                </body>
            </html>
            """
            for alumni_member in alumni:
                if alumni_member.get("email"):
                    await send_email(alumni_member["email"], f"New Job: {job['title']} at {job['company']}", html_content)
    
    return await job_to_response(job)


@router.get("/{job_id}", response_model=JobResponse)
async def get_single_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await get_job_by_id(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if not job["approved"] and user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return await job_to_response(job)


@router.get("/my/postings", response_model=List[JobResponse])
async def get_my_jobs(user: dict = Depends(get_current_user)):
    from ..db import get_database
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    jobs = await db.jobs.find({"created_by": ObjectId(str(user["_id"]))}).sort("created_at", -1).to_list(length=100)
    
    return [await job_to_response(j) for j in jobs]
