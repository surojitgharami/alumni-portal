from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user
from ..core.security import get_password_hash

router = APIRouter(prefix="/admin/faculty", tags=["admin-faculty"])

class FacultyCreate(BaseModel):
    name: str
    email: str
    password: str
    department: str
    phone: str = ""

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("")
async def list_faculty(current_user: dict = Depends(get_admin_user)):
    """List all faculty members"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    faculty = await db.users.find({"role": "faculty"}).sort("name", 1).to_list(None)
    
    return [
        {
            "id": str(f["_id"]),
            "name": f.get("name"),
            "email": f.get("email"),
            "department": f.get("department"),
            "phone": f.get("phone"),
            "created_at": f.get("created_at")
        }
        for f in faculty
    ]

@router.post("")
async def create_faculty(request: FacultyCreate, current_user: dict = Depends(get_admin_user)):
    """Create new faculty account"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    # Check if email exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    faculty_doc = {
        "name": request.name,
        "email": request.email,
        "password_hash": get_password_hash(request.password),
        "department": request.department,
        "phone": request.phone,
        "role": "faculty",
        "created_at": datetime.utcnow(),
        "joined_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(faculty_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Faculty account created successfully"
    }

@router.put("/{faculty_id}")
async def update_faculty(
    faculty_id: str,
    request: FacultyUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """Update faculty details"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(faculty_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid faculty ID")
    
    update_data = request.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one(
        {"_id": obj_id, "role": "faculty"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    return {"message": "Faculty updated successfully"}

@router.delete("/{faculty_id}")
async def delete_faculty(faculty_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete faculty account"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(faculty_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid faculty ID")
    
    result = await db.users.delete_one({"_id": obj_id, "role": "faculty"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    return {"message": "Faculty account deleted successfully"}

@router.put("/{faculty_id}/resetpassword")
async def reset_faculty_password(
    faculty_id: str,
    new_password: str,
    current_user: dict = Depends(get_admin_user)
):
    """Reset faculty password"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(faculty_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid faculty ID")
    
    result = await db.users.update_one(
        {"_id": obj_id, "role": "faculty"},
        {"$set": {"password_hash": get_password_hash(new_password)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    return {"message": "Password reset successfully"}
