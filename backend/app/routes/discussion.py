from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/discussion", tags=["discussion"])

class PostCreate(BaseModel):
    title: str
    content: str

class ReplyCreate(BaseModel):
    content: str

@router.get("/department")
async def get_department_discussion(current_user: dict = Depends(get_current_user)):
    """Get discussion posts for user's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    posts = await db.discussion_posts.find({
        "department": department,
        "status": "approved"
    }).sort("created_at", -1).to_list(None)
    
    result = []
    for p in posts:
        replies = await db.discussion_replies.find({
            "post_id": str(p["_id"])
        }).to_list(None)
        
        result.append({
            "id": str(p["_id"]),
            "title": p.get("title"),
            "content": p.get("content"),
            "author": p.get("author_name"),
            "author_role": p.get("author_role"),
            "created_at": p.get("created_at"),
            "replies_count": len(replies)
        })
    
    return result

@router.post("")
async def create_post(request: PostCreate, current_user: dict = Depends(get_current_user)):
    """Create discussion post (student/alumni)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Department not set")
    
    if current_user.get("role") not in ["student", "alumni"]:
        raise HTTPException(status_code=403, detail="Only students and alumni can post")
    
    post_doc = {
        "title": request.title,
        "content": request.content,
        "department": department,
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("name"),
        "author_role": current_user.get("role"),
        "status": "approved",
        "created_at": datetime.utcnow(),
        "replies_count": 0
    }
    
    result = await db.discussion_posts.insert_one(post_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Post created successfully"
    }

@router.post("/{post_id}/reply")
async def reply_to_post(
    post_id: str,
    request: ReplyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Reply to discussion post"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    post = await db.discussion_posts.find_one({"_id": obj_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    reply_doc = {
        "post_id": post_id,
        "content": request.content,
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("name"),
        "author_role": current_user.get("role"),
        "created_at": datetime.utcnow()
    }
    
    await db.discussion_replies.insert_one(reply_doc)
    await db.discussion_posts.update_one(
        {"_id": obj_id},
        {"$inc": {"replies_count": 1}}
    )
    
    return {"message": "Reply posted successfully"}

@router.get("/{post_id}/replies")
async def get_post_replies(post_id: str, current_user: dict = Depends(get_current_user)):
    """Get replies to a post"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    replies = await db.discussion_replies.find({
        "post_id": post_id
    }).sort("created_at", 1).to_list(None)
    
    return [
        {
            "id": str(r["_id"]),
            "content": r.get("content"),
            "author": r.get("author_name"),
            "author_role": r.get("author_role"),
            "created_at": r.get("created_at")
        }
        for r in replies
    ]
