"""Discussion moderation improvements: soft-delete, restore, reports"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/discussion/moderation", tags=["discussion-moderation"])

class ReportRequest(BaseModel):
    reason: str  # "spam", "inappropriate", "harassment", "other"
    details: str = ""

@router.post("/{post_id}/soft-delete")
async def soft_delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete a post (can be restored)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can moderate")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    try:
        await db.discussion_posts.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "deleted": True,
                    "deleted_at": datetime.utcnow(),
                    "deleted_by": str(current_user["_id"])
                }
            }
        )
        
        # Log moderation action
        await db.moderation_logs.insert_one({
            "action": "soft_delete",
            "post_id": post_id,
            "moderator_id": str(current_user["_id"]),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Post soft deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting post: {str(e)}")

@router.post("/{post_id}/restore")
async def restore_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Restore a soft-deleted post"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can restore")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    try:
        await db.discussion_posts.update_one(
            {"_id": obj_id},
            {
                "$set": {"deleted": False},
                "$unset": {"deleted_at": "", "deleted_by": ""}
            }
        )
        
        await db.moderation_logs.insert_one({
            "action": "restore",
            "post_id": post_id,
            "moderator_id": str(current_user["_id"]),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Post restored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restoring post: {str(e)}")

@router.post("/{post_id}/report")
async def report_post(
    post_id: str,
    request: ReportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Report a post for moderation"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    try:
        await db.post_reports.insert_one({
            "post_id": post_id,
            "reported_by": str(current_user["_id"]),
            "reason": request.reason,
            "details": request.details,
            "status": "pending",
            "created_at": datetime.utcnow()
        })
        
        return {"message": "Post reported to moderators"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reporting post: {str(e)}")

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    """Get pending reports (faculty only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can view reports")
    
    try:
        reports = await db.post_reports.find({
            "status": "pending"
        }).sort("created_at", 1).to_list(None)
        
        return [
            {
                "id": str(r["_id"]),
                "post_id": r.get("post_id"),
                "reason": r.get("reason"),
                "details": r.get("details"),
                "created_at": r.get("created_at")
            }
            for r in reports
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@router.get("/logs")
async def get_moderation_logs(current_user: dict = Depends(get_current_user)):
    """Get moderation logs (faculty only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can view logs")
    
    try:
        logs = await db.moderation_logs.find({}).sort("timestamp", -1).limit(100).to_list(None)
        
        return [
            {
                "id": str(log["_id"]),
                "action": log.get("action"),
                "post_id": log.get("post_id"),
                "timestamp": log.get("timestamp")
            }
            for log in logs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching moderation logs: {str(e)}")

@router.post("/auto-lock-inactive")
async def auto_lock_inactive_posts(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Auto-lock posts inactive for X days (admin only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.discussion_posts.update_many(
            {
                "created_at": {"$lt": cutoff_date},
                "locked": {"$exists": False}
            },
            {
                "$set": {
                    "locked": True,
                    "locked_at": datetime.utcnow(),
                    "locked_reason": "Inactivity"
                }
            }
        )
        
        return {
            "message": f"Locked {result.modified_count} inactive posts",
            "locked_count": result.modified_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error locking posts: {str(e)}")
