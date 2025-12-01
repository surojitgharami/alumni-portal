from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/communication", tags=["faculty-communication"])

class BulkEmailRequest(BaseModel):
    subject: str
    body: str
    recipient_type: str  # "students", "alumni", "all"
    passout_years: Optional[List[int]] = None

@router.post("/sendemail")
async def send_bulk_email(request: BulkEmailRequest, current_user: dict = Depends(get_faculty_user)):
    """Send bulk email to department users"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    # Get recipients based on type
    query = {"department": department}
    if request.recipient_type == "students":
        query["role"] = "student"
    elif request.recipient_type == "alumni":
        query["role"] = "alumni"
    
    if request.passout_years:
        query["passout_year"] = {"$in": request.passout_years}
    
    recipients = await db.users.find(query).to_list(None)
    recipient_emails = [r.get("email") for r in recipients if r.get("email")]
    
    if not recipient_emails:
        raise HTTPException(status_code=400, detail="No recipients found")
    
    # Log email for audit trail (TODO: integrate with actual email service)
    email_log = {
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("name"),
        "department": department,
        "subject": request.subject,
        "body": request.body,
        "recipient_count": len(recipient_emails),
        "recipient_type": request.recipient_type,
        "created_at": datetime.utcnow(),
        "status": "sent"
    }
    
    await db.email_logs.insert_one(email_log)
    
    return {
        "message": f"Email sent to {len(recipient_emails)} recipients",
        "count": len(recipient_emails)
    }

@router.get("/email-logs")
async def get_email_logs(current_user: dict = Depends(get_faculty_user)):
    """Get email sending history"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    logs = await db.email_logs.find({
        "department": department,
        "sender_id": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(log["_id"]),
            "subject": log.get("subject"),
            "recipient_count": log.get("recipient_count"),
            "recipient_type": log.get("recipient_type"),
            "created_at": log.get("created_at")
        }
        for log in logs
    ]

@router.get("/discussion")
async def get_discussion(current_user: dict = Depends(get_faculty_user)):
    """Get discussion posts for moderation"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    posts = await db.discussion_posts.find({
        "department": department
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(p["_id"]),
            "title": p.get("title"),
            "content": p.get("content"),
            "author": p.get("author_name"),
            "created_at": p.get("created_at"),
            "status": p.get("status", "approved"),
            "replies_count": p.get("replies_count", 0)
        }
        for p in posts
    ]

@router.put("/discussion/{post_id}/approve")
async def approve_post(post_id: str, current_user: dict = Depends(get_faculty_user)):
    """Approve discussion post"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    result = await db.discussion_posts.update_one(
        {"_id": obj_id},
        {"$set": {"status": "approved"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post approved"}

@router.delete("/discussion/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_faculty_user)):
    """Delete inappropriate discussion post"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    result = await db.discussion_posts.delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post deleted"}
