"""Security utilities: brute force protection, token management"""
from datetime import datetime, timedelta
from typing import Optional
from .db import get_database
from .core.settings import settings


async def check_login_attempts(email: str) -> tuple[bool, str]:
    """Check if user is locked out due to failed login attempts"""
    db = get_database()
    if db is None:
        return True, "Database unavailable"
    
    try:
        # Get recent failed attempts
        cutoff_time = datetime.utcnow() - timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
        
        failed_attempts = await db.login_attempts.count_documents({
            "email": email,
            "success": False,
            "timestamp": {"$gte": cutoff_time}
        })
        
        if failed_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            return False, f"Account locked due to {failed_attempts} failed attempts. Try again in {settings.LOCKOUT_DURATION_MINUTES} minutes"
        
        return True, ""
    except Exception as e:
        print(f"⚠️ Error checking login attempts: {str(e)}")
        return True, ""


async def record_login_attempt(email: str, success: bool, ip: Optional[str] = None):
    """Record login attempt"""
    db = get_database()
    if db is None:
        return
    
    try:
        await db.login_attempts.insert_one({
            "email": email,
            "success": success,
            "ip_address": ip,
            "timestamp": datetime.utcnow()
        })
    except Exception as e:
        print(f"⚠️ Error recording login attempt: {str(e)}")


async def check_password_history(user_id: str, new_password: str) -> tuple[bool, str]:
    """Check if password was used recently (prevent reuse of last 3)"""
    db = get_database()
    if db is None:
        return True, ""
    
    try:
        from .core.security import verify_password
        
        history_cursor = db.password_history.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(settings.PASSWORD_HISTORY_COUNT)
        
        history = await history_cursor.to_list(None)
        
        if history:
            for entry in history:
                if verify_password(new_password, entry.get("password_hash", "")):
                    return False, f"Password was used recently. Choose a different password"
        
        return True, ""
    except Exception as e:
        print(f"⚠️ Error checking password history: {str(e)}")
        return True, ""


async def store_password_history(user_id: str, password_hash: str):
    """Store password in history for reuse prevention"""
    db = get_database()
    if db is None:
        return
    
    try:
        await db.password_history.insert_one({
            "user_id": user_id,
            "password_hash": password_hash,
            "timestamp": datetime.utcnow()
        })
    except Exception as e:
        print(f"⚠️ Error storing password history: {str(e)}")


async def cleanup_old_refresh_tokens(user_id: str):
    """Keep only latest MAX_REFRESH_TOKENS_PER_USER tokens (max 3 active sessions)"""
    db = get_database()
    if db is None:
        return
    
    try:
        # Get token count for user
        token_count = await db.refresh_tokens.count_documents({"user_id": user_id})
        
        if token_count >= settings.MAX_REFRESH_TOKENS_PER_USER:
            # Delete oldest token
            oldest = await db.refresh_tokens.find_one(
                {"user_id": user_id},
                sort=[("created_at", 1)]
            )
            if oldest:
                await db.refresh_tokens.delete_one({"_id": oldest["_id"]})
    except Exception as e:
        print(f"⚠️ Error cleaning refresh tokens: {str(e)}")
