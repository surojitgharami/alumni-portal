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


class UpdateFacultyRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    phone: Optional[str] = None


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


@router.put("/{faculty_id}")
async def update_faculty(
    faculty_id: str,
    request: UpdateFacultyRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Admin updates faculty user details"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if not ObjectId.is_valid(faculty_id):
        raise HTTPException(status_code=400, detail="Invalid faculty ID")
    
    faculty = await db.users.find_one({"_id": ObjectId(faculty_id), "role": "faculty"})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    # Check if new email already exists (if email is different)
    if request.email != faculty["email"]:
        existing = await db.users.find_one({"email": request.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    update_data = {
        "name": request.name,
        "email": request.email,
        "department": request.department,
        "phone": request.phone or ""
    }
    
    result = await db.users.update_one(
        {"_id": ObjectId(faculty_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update faculty")
    
    return {
        "id": faculty_id,
        "name": request.name,
        "email": request.email,
        "department": request.department,
        "phone": request.phone or "",
        "message": "Faculty updated successfully"
    }


@router.delete("/{faculty_id}")
async def delete_faculty(
    faculty_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Admin deletes faculty user"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if not ObjectId.is_valid(faculty_id):
        raise HTTPException(status_code=400, detail="Invalid faculty ID")
    
    faculty = await db.users.find_one({"_id": ObjectId(faculty_id), "role": "faculty"})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    result = await db.users.delete_one({"_id": ObjectId(faculty_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete faculty")
    
    return {"message": "Faculty deleted successfully", "faculty_id": faculty_id}
