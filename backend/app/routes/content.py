from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Optional, List
from ..deps import get_current_user
from ..db import get_database
from bson import ObjectId
import base64

router = APIRouter(prefix="/admin/content", tags=["Content Management"])

@router.post("/homepage")
async def update_homepage_content(request: dict, user: dict = Depends(get_current_user)):
    """Update homepage hero content"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        result = await db.content.update_one(
            {"type": "homepage"},
            {"$set": {"type": "homepage", **request}},
            upsert=True
        )
        return {"success": True, "message": "Homepage content updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/homepage")
async def get_homepage_content():
    """Get homepage content"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        content = await db.content.find_one({"type": "homepage"})
        if not content:
            return {
                "title": "Alumni Portal",
                "subtitle": "Connect, Grow, and Give Back",
                "description": "Join our vibrant community of alumni making an impact",
                "cta_text": "Get Started",
                "hero_image": None
            }
        content.pop("_id", None)
        content.pop("type", None)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/upload-content-image")
async def upload_content_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload image for content"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image must be less than 10MB")
        
        image_data = base64.b64encode(contents).decode('utf-8')
        image_url = f"data:{file.content_type};base64,{image_data}"
        
        return {"success": True, "url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/jobs-featured")
async def set_featured_jobs(request: dict, user: dict = Depends(get_current_user)):
    """Set featured jobs for display"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        await db.content.update_one(
            {"type": "featured_jobs"},
            {"$set": {"type": "featured_jobs", "job_ids": request.get("job_ids", []), "title": request.get("title", "Featured Opportunities")}},
            upsert=True
        )
        return {"success": True, "message": "Featured jobs updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/jobs-featured")
async def get_featured_jobs():
    """Get featured jobs"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        content = await db.content.find_one({"type": "featured_jobs"})
        if not content:
            return {"job_ids": [], "title": "Featured Opportunities"}
        return {"job_ids": content.get("job_ids", []), "title": content.get("title", "Featured Opportunities")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/events-featured")
async def set_featured_events(request: dict, user: dict = Depends(get_current_user)):
    """Set featured events for display"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        await db.content.update_one(
            {"type": "featured_events"},
            {"$set": {"type": "featured_events", "event_ids": request.get("event_ids", []), "title": request.get("title", "Upcoming Events")}},
            upsert=True
        )
        return {"success": True, "message": "Featured events updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/events-featured")
async def get_featured_events():
    """Get featured events"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        content = await db.content.find_one({"type": "featured_events"})
        if not content:
            return {"event_ids": [], "title": "Upcoming Events"}
        return {"event_ids": content.get("event_ids", []), "title": content.get("title", "Upcoming Events")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/sections")
async def manage_sections(request: dict, user: dict = Depends(get_current_user)):
    """Manage portal sections (About, Contact, etc)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        section_name = request.get("section_name", "").lower()
        # Remove section_name from the data to store (it's only used for identification)
        data_to_store = {k: v for k, v in request.items() if k != "section_name"}
        
        await db.content.update_one(
            {"type": "section", "name": section_name},
            {"$set": {"type": "section", "name": section_name, **data_to_store}},
            upsert=True
        )
        return {"success": True, "message": f"Section '{section_name}' updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/sections/{section_name}")
async def get_section(section_name: str):
    """Get section content"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        section = await db.content.find_one({"type": "section", "name": section_name.lower()})
        if not section:
            return {}
        # Only remove internal fields, keep all content fields
        section.pop("_id", None)
        section.pop("type", None)
        section.pop("name", None)
        return section
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/gallery")
async def update_gallery_images(request: dict, user: dict = Depends(get_current_user)):
    """Update carousel/gallery images for landing page"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        gallery_images = request.get("images", [])
        await db.content.update_one(
            {"type": "gallery"},
            {"$set": {"type": "gallery", "images": gallery_images}},
            upsert=True
        )
        return {"success": True, "message": "Gallery images updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/gallery")
async def get_gallery_images():
    """Get carousel/gallery images for landing page"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        content = await db.content.find_one({"type": "gallery"})
        if not content:
            # Return default images if none configured
            return {
                "images": [
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop"
                ]
            }
        return {"images": content.get("images", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/all")
async def get_all_content():
    """Get all managed content"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        content = await db.content.find({}).to_list(None)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
