from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .core.security import decode_token
from .db import get_database
from bson import ObjectId

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Handle admin user (stored in environment, not in database)
    if user_id == "admin":
        return payload
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Database unavailable"
        )
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID"
        )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    role = payload.get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return payload


async def get_alumni_user(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["alumni", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Alumni or admin access required"
        )
    return user


async def get_active_member(user: dict = Depends(get_current_user)):
    is_faculty = user.get("role") == "faculty"
    if not is_faculty and user.get("membership_status") != "active" and user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active membership required"
        )
    return user


async def get_alumni_with_membership(user: dict = Depends(get_current_user)):
    role = user.get("role")
    if role == "admin" or role == "faculty":
        return user
    
    if role != "alumni":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Alumni access required"
        )
    
    if user.get("membership_status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active membership required to perform this action"
        )
    
    return user


async def get_faculty_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required"
        )
    return user
