"""Faculty Gallery - manage department gallery items"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/gallery", tags=["faculty-gallery"])

class GalleryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    category: Optional[str] = None

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None

@router.get("")
async def get_faculty_gallery(current_user: dict = Depends(get_faculty_user)):
    """Get gallery items for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    gallery_items = await db.gallery.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(g["_id"]),
            "title": g.get("title"),
            "description": g.get("description"),
            "image_url": g.get("image_url"),
            "category": g.get("category"),
            "created_at": g.get("created_at")
        }
        for g in gallery_items
    ]

@router.post("")
async def create_gallery_item(
    request: GalleryCreate,
    current_user: dict = Depends(get_faculty_user)
):
    """Create gallery item for department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    gallery_doc = {
        "title": request.title,
        "description": request.description,
        "image_url": request.image_url,
        "category": request.category,
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow()
    }
    
    result = await db.gallery.insert_one(gallery_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Gallery item created successfully"
    }

@router.patch("/{gallery_id}")
async def update_gallery_item(
    gallery_id: str,
    request: GalleryUpdate,
    current_user: dict = Depends(get_faculty_user)
):
    """Update gallery item"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(gallery_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid gallery item ID")
    
    gallery_item = await db.gallery.find_one({"_id": obj_id})
    if not gallery_item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    
    if gallery_item.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    update_data = {}
    if request.title:
        update_data["title"] = request.title
    if request.description is not None:
        update_data["description"] = request.description
    if request.image_url:
        update_data["image_url"] = request.image_url
    if request.category is not None:
        update_data["category"] = request.category
    
    await db.gallery.update_one({"_id": obj_id}, {"$set": update_data})
    return {"message": "Gallery item updated successfully"}

@router.delete("/{gallery_id}")
async def delete_gallery_item(
    gallery_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Delete gallery item"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(gallery_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid gallery item ID")
    
    gallery_item = await db.gallery.find_one({"_id": obj_id})
    if not gallery_item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    
    if gallery_item.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    await db.gallery.delete_one({"_id": obj_id})
    return {"message": "Gallery item deleted successfully"}
