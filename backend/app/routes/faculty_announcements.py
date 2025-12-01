from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/announcements", tags=["faculty-announcements"])

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    announcement_type: str = "general"
    target_audience: str = "all"  # students, alumni, all

@router.get("")
async def get_faculty_announcements(current_user: dict = Depends(get_faculty_user)):
    """Get announcements for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    announcements = await db.announcements.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(a["_id"]),
            "title": a.get("title"),
            "content": a.get("content"),
            "announcement_type": a.get("announcement_type", "general"),
            "target_audience": a.get("target_audience", "all"),
            "created_at": a.get("created_at"),
            "created_by": a.get("created_by")
        }
        for a in announcements
    ]

@router.post("")
async def create_faculty_announcement(
    request: AnnouncementCreate,
    current_user: dict = Depends(get_faculty_user)
):
    """Create announcement for department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    announcement_doc = {
        "title": request.title,
        "content": request.content,
        "announcement_type": request.announcement_type,
        "target_audience": request.target_audience,
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow(),
        "status": "published"
    }
    
    result = await db.announcements.insert_one(announcement_doc)
    
    return {
        "id": str(result.inserted_id),
        "message": "Announcement created successfully"
    }

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Delete faculty announcement"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(announcement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid announcement ID")
    
    announcement = await db.announcements.find_one({"_id": obj_id})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check ownership
    if announcement.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement")
    
    await db.announcements.delete_one({"_id": obj_id})
    return {"message": "Announcement deleted successfully"}
