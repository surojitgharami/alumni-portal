from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_admin
from ..core.security import get_password_hash, create_access_token
from ..models import UserResponse

router = APIRouter(prefix="/admin/faculty", tags=["faculty-admin"])


class CreateFacultyRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    phone: Optional[str] = None


class FacultyListResponse(BaseModel):
    id: str
    name: str
    email: str
    department: str
    phone: Optional[str]
    created_at: datetime


@router.post("/create")
async def create_faculty(
    request: CreateFacultyRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Admin creates faculty user"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    # Check if email exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create faculty user
    import secrets
    temp_password = secrets.token_urlsafe(12)
    
    faculty_user = {
        "name": request.name,
        "email": request.email,
        "department": request.department,
        "phone": request.phone or "",
        "password_hash": get_password_hash(temp_password),
        "role": "faculty",
        "created_at": datetime.utcnow(),
        "is_blocked": False
    }
    
    result = await db.users.insert_one(faculty_user)
    
    return {
        "id": str(result.inserted_id),
        "name": request.name,
        "email": request.email,
        "department": request.department,
        "temp_password": temp_password,
        "message": "Faculty created successfully. Share temp password securely."
    }


@router.get("/list")
async def list_faculty(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Admin lists all faculty"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    query = {"role": "faculty"}
    if department:
        query["department"] = department
    
    faculty_list = await db.users.find(query).sort("name", 1).to_list(None)
    
    return [
        FacultyListResponse(
            id=str(f["_id"]),
            name=f["name"],
            email=f["email"],
            department=f["department"],
            phone=f.get("phone"),
            created_at=f.get("created_at", datetime.utcnow())
        )
        for f in faculty_list
    ]
