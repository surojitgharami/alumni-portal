from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/newsletters", tags=["faculty-newsletters"])

class NewsletterCreate(BaseModel):
    title: str
    content: str
    month: Optional[str] = None
    semester: Optional[str] = None

@router.get("")
async def get_faculty_newsletters(current_user: dict = Depends(get_faculty_user)):
    """Get newsletters for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    newsletters = await db.newsletter.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(n["_id"]),
            "title": n.get("title"),
            "content": n.get("content"),
            "month": n.get("month"),
            "semester": n.get("semester"),
            "published_date": n.get("published_date"),
            "created_at": n.get("created_at")
        }
        for n in newsletters
    ]

@router.post("")
async def create_faculty_newsletter(
    request: NewsletterCreate,
    current_user: dict = Depends(get_faculty_user)
):
    """Create newsletter for department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    newsletter_doc = {
        "title": request.title,
        "content": request.content,
        "month": request.month,
        "semester": request.semester,
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow(),
        "published_date": datetime.utcnow(),
        "status": "published"
    }
    
    result = await db.newsletter.insert_one(newsletter_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Newsletter published successfully"
    }

@router.delete("/{newsletter_id}")
async def delete_newsletter(
    newsletter_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Delete faculty newsletter"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(newsletter_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid newsletter ID")
    
    newsletter = await db.newsletter.find_one({"_id": obj_id})
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    if newsletter.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this newsletter")
    
    await db.newsletter.delete_one({"_id": obj_id})
    return {"message": "Newsletter deleted successfully"}
