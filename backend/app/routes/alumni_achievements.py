from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/alumni/achievements", tags=["alumni-achievements"])

class AchievementSubmit(BaseModel):
    title: str
    description: str
    category: str  # "award", "publication", "promotion", "startup", "other"
    image_url: Optional[str] = None

@router.post("")
async def submit_achievement(request: AchievementSubmit, current_user: dict = Depends(get_current_user)):
    """Alumni submit achievement for faculty approval"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") not in ["alumni", "student"]:
        raise HTTPException(status_code=403, detail="Only alumni and students can submit achievements")
    
    achievement_doc = {
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "image_url": request.image_url,
        "submitted_by": str(current_user["_id"]),
        "submitted_by_name": current_user.get("name"),
        "department": current_user.get("department"),
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.achievement_submissions.insert_one(achievement_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Achievement submitted for faculty approval"
    }

@router.get("/my-submissions")
async def get_my_submissions(current_user: dict = Depends(get_current_user)):
    """Get user's achievement submissions"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    submissions = await db.achievement_submissions.find({
        "submitted_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(s["_id"]),
            "title": s.get("title"),
            "description": s.get("description"),
            "category": s.get("category"),
            "status": s.get("status"),
            "created_at": s.get("created_at")
        }
        for s in submissions
    ]

@router.get("/pending")
async def get_pending_submissions(current_user: dict = Depends(get_current_user)):
    """Get pending achievements for faculty approval"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can approve achievements")
    
    department = current_user.get("department")
    if not department:
        return []
    
    submissions = await db.achievement_submissions.find({
        "department": department,
        "status": "pending"
    }).sort("created_at", 1).to_list(None)
    
    return [
        {
            "id": str(s["_id"]),
            "title": s.get("title"),
            "description": s.get("description"),
            "category": s.get("category"),
            "submitted_by": s.get("submitted_by_name"),
            "created_at": s.get("created_at")
        }
        for s in submissions
    ]

@router.put("/{achievement_id}/approve")
async def approve_achievement(achievement_id: str, current_user: dict = Depends(get_current_user)):
    """Faculty approve achievement"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can approve achievements")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    result = await db.achievement_submissions.update_one(
        {"_id": obj_id},
        {"$set": {"status": "approved", "approved_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return {"message": "Achievement approved"}

@router.put("/{achievement_id}/reject")
async def reject_achievement(achievement_id: str, current_user: dict = Depends(get_current_user)):
    """Faculty reject achievement"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can reject achievements")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    result = await db.achievement_submissions.update_one(
        {"_id": obj_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return {"message": "Achievement rejected"}
