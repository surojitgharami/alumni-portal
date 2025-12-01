from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Any
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/{faculty_id}")
async def get_faculty_by_id(
    faculty_id: str,
    current_user = Depends(get_current_user)
):
    """Get faculty member by ID"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    try:
        faculty = await db.users.find_one({"_id": ObjectId(faculty_id), "role": "faculty"})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid faculty ID")

    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return {
        "id": str(faculty["_id"]),
        "name": faculty["name"],
        "department": faculty["department"],
        "email": faculty["email"],
        "phone": faculty.get("phone"),
        "profile_photo_url": faculty.get("profile_photo_url"),
        "professional": faculty.get("professional"),
        "bio": faculty.get("bio"),
        "location": faculty.get("location"),
        "designation": faculty.get("professional", {}).get("designation") if faculty.get("professional") else None
    }


@router.get("")
async def get_faculty(
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get faculty members with filters"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    and_conditions: list[Any] = [{"role": "faculty"}]

    if department:
        and_conditions.append({"department": department})

    if search:
        and_conditions.append({
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        })

    query: dict[str, Any] = {"$and": and_conditions} if len(and_conditions) > 1 else and_conditions[0]

    faculty = await db.users.find(query).skip(skip).limit(limit).sort("name", 1).to_list(None)

    return [
        {
            "id": str(f["_id"]),
            "name": f["name"],
            "department": f["department"],
            "email": f["email"],
            "phone": f.get("phone"),
            "profile_photo_url": f.get("profile_photo_url"),
            "professional": f.get("professional"),
            "designation": f.get("professional", {}).get("designation") if f.get("professional") else None
        }
        for f in faculty
    ]
