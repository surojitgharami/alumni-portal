"""Audit logging for security tracking"""
from datetime import datetime
from typing import Optional
from .db import get_database


async def log_audit_event(
    action: str,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    status: str = "success",
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log an audit event to audit_logs collection"""
    db = get_database()
    if db is None:
        print(f"⚠️ Database unavailable for audit: {action}")
        return
    
    try:
        audit_log = {
            "action": action,
            "user_id": user_id,
            "resource": resource,
            "status": status,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow()
        }
        
        await db.audit_logs.insert_one(audit_log)
    except Exception as e:
        print(f"⚠️ Error logging audit event: {str(e)}")


async def log_login_attempt(email: str, success: bool, ip: Optional[str] = None, user_agent: Optional[str] = None):
    """Log login attempt"""
    await log_audit_event(
        action="login_attempt",
        resource=email,
        status="success" if success else "failed",
        ip_address=ip,
        user_agent=user_agent
    )


async def log_password_change(user_id: str, ip: Optional[str] = None):
    """Log password change"""
    await log_audit_event(
        action="password_change",
        user_id=user_id,
        status="success",
        ip_address=ip
    )


async def log_admin_action(user_id: str, action: str, resource: str, details: Optional[dict] = None):
    """Log admin action (create/update/delete)"""
    await log_audit_event(
        action=f"admin_{action}",
        user_id=user_id,
        resource=resource,
        status="success",
        details=details
    )


async def log_payment_event(user_id: str, status: str, order_id: str, amount: int):
    """Log payment event"""
    await log_audit_event(
        action="payment",
        user_id=user_id,
        resource=order_id,
        status=status,
        details={"amount": amount}
    )
