from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List, Optional
from ..deps import get_current_user
from ..db import get_database
from ..models import UserUpdateRequest, Achievement, ProfileResponse
from bson import ObjectId
from datetime import datetime
import base64
import io

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile with professional info and achievements"""
    try:
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        profile = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Faculty users don't have membership status
        is_faculty = profile.get("role") == "faculty"
        membership = None if is_faculty else profile.get("membership_status", "unpaid")
        
        return ProfileResponse(
            id=str(profile["_id"]),
            name=profile["name"],
            dob=profile.get("dob", "2000-01-01"),
            email=profile["email"],
            phone=profile.get("phone", ""),
            registration_number=profile.get("registration_number", ""),
            passout_year=profile.get("passout_year", 0),
            department=profile.get("department", ""),
            role=profile.get("role", "student"),
            membership_status=membership,
            profile_photo_url=profile.get("profile_photo_url"),
            resume_url=profile.get("resume_url"),
            guardian_name=profile.get("guardian_name"),
            nationality=profile.get("nationality"),
            gender=profile.get("gender"),
            marital_status=profile.get("marital_status"),
            employment_status=profile.get("employment_status"),
            employer_name=profile.get("employer_name"),
            highest_qualification=profile.get("highest_qualification"),
            address=profile.get("address"),
            social_media=profile.get("social_media"),
            professional=profile.get("professional"),
            achievements=profile.get("achievements", []),
            joined_at=profile.get("joined_at", datetime.utcnow())
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.put("")
async def update_profile(request: dict, user: dict = Depends(get_current_user)):
    """Update user profile"""
    try:
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        update_data = {}
        
        if request.get('name'):
            update_data["name"] = request["name"]
        if request.get('phone'):
            update_data["phone"] = request["phone"]
        if request.get('dob'):
            update_data["dob"] = request["dob"]
        if request.get('guardian_name'):
            update_data["guardian_name"] = request["guardian_name"]
        if request.get('nationality'):
            update_data["nationality"] = request["nationality"]
        if request.get('gender'):
            update_data["gender"] = request["gender"]
        if request.get('marital_status'):
            update_data["marital_status"] = request["marital_status"]
        if request.get('employment_status'):
            update_data["employment_status"] = request["employment_status"]
        if request.get('employer_name'):
            update_data["employer_name"] = request["employer_name"]
        if request.get('highest_qualification'):
            update_data["highest_qualification"] = request["highest_qualification"]
        if request.get('address'):
            update_data["address"] = request["address"]
        if request.get('social_media'):
            update_data["social_media"] = request["social_media"]
        
        if request.get('workplace') or request.get('designation') or request.get('industry') or request.get('skills'):
            update_data["professional"] = {
                "workplace": request.get("workplace") or "",
                "designation": request.get("designation") or "",
                "industry": request.get("industry") or "",
                "skills": request.get("skills") or []
            }
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        updated_profile = await db.users.find_one({"_id": ObjectId(user_id)})
        if not updated_profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": str(updated_profile["_id"]),
                "name": updated_profile["name"],
                "email": updated_profile["email"],
                "phone": updated_profile["phone"],
                "profile_photo_url": updated_profile.get("profile_photo_url"),
                "professional": updated_profile.get("professional"),
                "achievements": updated_profile.get("achievements", [])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.post("/upload-photo")
async def upload_profile_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload profile photo"""
    try:
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        contents = await file.read()
        
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size must be less than 5MB"
            )
        
        photo_data = base64.b64encode(contents).decode('utf-8')
        photo_url = f"data:{file.content_type};base64,{photo_data}"
        
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_photo_url": photo_url}}
        )
        
        return {"success": True, "message": "Photo uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload photo")

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload resume file (PDF or DOC)"""
    try:
        allowed_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if not file.content_type or file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be PDF or DOC format"
            )
        
        contents = await file.read()
        
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume size must be less than 10MB"
            )
        
        resume_data = base64.b64encode(contents).decode('utf-8')
        resume_url = f"data:{file.content_type};base64,{resume_data}"
        
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"resume_url": resume_url}}
        )
        
        return {"success": True, "message": "Resume uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload resume")

@router.post("/achievement")
async def add_achievement(request: Achievement, user: dict = Depends(get_current_user)):
    """Add achievement/certification"""
    try:
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        achievement = {
            "title": request.title,
            "description": request.description or "",
            "certification_url": request.certification_url or "",
            "date": request.date or datetime.utcnow()
        }
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"achievements": achievement}}
        )
        
        return {"success": True, "message": "Achievement added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error adding achievement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add achievement")

@router.delete("/achievement/{achievement_id}")
async def delete_achievement(achievement_id: str, user: dict = Depends(get_current_user)):
    """Delete achievement"""
    try:
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"achievements": {"_id": ObjectId(achievement_id) if ObjectId.is_valid(achievement_id) else None}}}
        )
        
        return {"success": True, "message": "Achievement deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting achievement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete achievement")

@router.post("/upload-achievement-cert")
async def upload_achievement_cert(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload achievement certification file"""
    try:
        contents = await file.read()
        
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 10MB"
            )
        
        cert_data = base64.b64encode(contents).decode('utf-8')
        cert_url = f"data:{file.content_type};base64,{cert_data}"
        
        return {"success": True, "url": cert_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading certificate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload certificate")
