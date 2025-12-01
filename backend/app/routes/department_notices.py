from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/notices", tags=["department-notices"])

class NoticeCreate(BaseModel):
    title: str
    content: str
    notice_type: str  # "circular", "exam", "internship", "general"
    file_url: Optional[str] = None

@router.get("")
async def get_notices(current_user: dict = Depends(get_faculty_user)):
    """Get all department notices"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    notices = await db.notices.find({
        "department": department
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(n["_id"]),
            "title": n.get("title"),
            "content": n.get("content"),
            "notice_type": n.get("notice_type"),
            "file_url": n.get("file_url"),
            "published": n.get("published", True),
            "created_at": n.get("created_at")
        }
        for n in notices
    ]

@router.post("")
async def create_notice(request: NoticeCreate, current_user: dict = Depends(get_faculty_user)):
    """Create new department notice"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    notice_doc = {
        "title": request.title,
        "content": request.content,
        "notice_type": request.notice_type,
        "file_url": request.file_url,
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "published": True,
        "created_at": datetime.utcnow()
    }
    
    result = await db.notices.insert_one(notice_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Notice published successfully"
    }

@router.put("/{notice_id}")
async def update_notice(
    notice_id: str,
    request: NoticeCreate,
    current_user: dict = Depends(get_faculty_user)
):
    """Update department notice"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(notice_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notice ID")
    
    notice = await db.notices.find_one({"_id": obj_id})
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    if notice.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this notice")
    
    update_data = {
        "title": request.title,
        "content": request.content,
        "notice_type": request.notice_type,
        "file_url": request.file_url,
        "updated_at": datetime.utcnow()
    }
    
    await db.notices.update_one({"_id": obj_id}, {"$set": update_data})
    return {"message": "Notice updated successfully"}

@router.delete("/{notice_id}")
async def delete_notice(notice_id: str, current_user: dict = Depends(get_faculty_user)):
    """Delete department notice"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(notice_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notice ID")
    
    notice = await db.notices.find_one({"_id": obj_id})
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    if notice.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this notice")
    
    await db.notices.delete_one({"_id": obj_id})
    return {"message": "Notice deleted successfully"}
