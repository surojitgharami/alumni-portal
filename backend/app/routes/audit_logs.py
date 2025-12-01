"""Admin and security audit logging"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/admin/audit", tags=["audit-logs"])

async def log_audit_event(action: str, resource: str, user_id: str, details: dict = None):
    """Log an audit event"""
    db = get_database()
    if db is None:
        return
    
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "resource": resource,
            "user_id": user_id,
            "details": details or {},
            "timestamp": datetime.utcnow(),
            "ip_address": None  # Would be captured from request context in real impl
        })
    except Exception as e:
        print(f"⚠️ Error logging audit event: {str(e)}")

@router.get("/logs")
async def get_audit_logs(
    action: str = None,
    resource: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get audit logs (admin only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        query = {}
        if action:
            query["action"] = action
        if resource:
            query["resource"] = resource
        
        logs = await db.audit_logs.find(query).sort("timestamp", -1).limit(limit).to_list(None)
        
        return [
            {
                "id": str(log["_id"]),
                "action": log.get("action"),
                "resource": log.get("resource"),
                "user_id": log.get("user_id"),
                "timestamp": log.get("timestamp"),
                "details": log.get("details")
            }
            for log in logs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audit logs: {str(e)}")

@router.get("/logs/summary")
async def audit_summary(current_user: dict = Depends(get_current_user)):
    """Get audit log summary"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        total_logs = await db.audit_logs.count_documents({})
        
        actions = {}
        logs = await db.audit_logs.find({}).to_list(None)
        for log in logs:
            action = log.get("action", "unknown")
            actions[action] = actions.get(action, 0) + 1
        
        return {
            "total_logs": total_logs,
            "actions": actions,
            "recent_actions": list(actions.keys())[-10:]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
