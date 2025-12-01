from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/faculty", tags=["faculty"])

async def get_faculty_user_verified(current_user: dict = Depends(get_current_user)):
    """Verify current authenticated user is faculty"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty access required")
    return current_user

class AchievementUpdate(BaseModel):
    title: str
    description: str

class AchievementCreate(BaseModel):
    title: str
    description: str
    category: str
    image_url: Optional[str] = None

@router.get("")
async def get_faculty_achievements(current_user: dict = Depends(get_faculty_user_verified)):
    """Get achievements for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    achievements = await db.achievements.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(a["_id"]),
            "title": a.get("title"),
            "description": a.get("description"),
            "category": a.get("category"),
            "image_url": a.get("image_url"),
            "created_at": a.get("created_at")
        }
        for a in achievements
    ]

@router.post("")
async def create_faculty_achievement(
    request: AchievementCreate,
    current_user: dict = Depends(get_faculty_user_verified)
):
    """Create achievement for department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    achievement_doc = {
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "image_url": request.image_url,
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow(),
        "status": "published"
    }
    
    result = await db.achievements.insert_one(achievement_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Achievement added successfully"
    }

@router.delete("/{achievement_id}")
async def delete_achievement(
    achievement_id: str,
    current_user: dict = Depends(get_faculty_user_verified)
):
    """Delete faculty achievement"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    achievement = await db.achievements.find_one({"_id": obj_id})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    if achievement.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this achievement")
    
    await db.achievements.delete_one({"_id": obj_id})
    return {"message": "Achievement deleted successfully"}


@router.get("/alumni-achievements")
async def get_alumni_achievements(current_user: dict = Depends(get_faculty_user_verified)):
    """Get alumni achievement submissions from faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    submissions = await db.achievement_submissions.find({
        "department": department
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(s["_id"]),
            "title": s.get("title"),
            "description": s.get("description"),
            "category": s.get("category"),
            "submitted_by": s.get("submitted_by_name"),
            "status": s.get("status"),
            "created_at": s.get("created_at")
        }
        for s in submissions
    ]


@router.put("/alumni-achievements/{achievement_id}")
async def update_alumni_achievement(
    achievement_id: str,
    request: AchievementUpdate,
    current_user: dict = Depends(get_faculty_user_verified)
):
    """Edit alumni achievement submission"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    achievement = await db.achievement_submissions.find_one({"_id": obj_id})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    department = current_user.get("department")
    if achievement.get("department") != department:
        raise HTTPException(status_code=403, detail="Not authorized to edit this achievement")
    
    result = await db.achievement_submissions.update_one(
        {"_id": obj_id},
        {"$set": {"title": request.title, "description": request.description}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return {"message": "Achievement updated successfully"}


@router.delete("/alumni-achievements/{achievement_id}")
async def delete_alumni_achievement(
    achievement_id: str,
    current_user: dict = Depends(get_faculty_user_verified)
):
    """Delete alumni achievement submission"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    achievement = await db.achievement_submissions.find_one({"_id": obj_id})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    department = current_user.get("department")
    if achievement.get("department") != department:
        raise HTTPException(status_code=403, detail="Not authorized to delete this achievement")
    
    await db.achievement_submissions.delete_one({"_id": obj_id})
    return {"message": "Achievement deleted successfully"}
