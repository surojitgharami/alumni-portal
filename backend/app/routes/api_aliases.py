"""API Aliases - backward compatibility routes mapping frontend calls to faculty routes"""
from fastapi import APIRouter, Depends, HTTPException
from ..deps import get_faculty_user
from ..db import get_database

router = APIRouter(tags=["aliases"])

@router.get("/api/newsletter")
async def get_newsletter_alias(current_user: dict = Depends(get_faculty_user)):
    """Alias: /api/newsletter -> /api/faculty/newsletters"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    newsletters = await db.newsletter.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(n["_id"]),
            "title": n.get("title"),
            "content": n.get("content"),
            "month": n.get("month"),
            "semester": n.get("semester"),
            "published_date": n.get("published_date"),
            "created_at": n.get("created_at")
        }
        for n in newsletters
    ]

@router.post("/api/newsletter")
async def create_newsletter_alias(
    request: dict,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: POST /api/newsletter -> /api/faculty/newsletters"""
    from datetime import datetime
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    newsletter_doc = {
        "title": request.get("title"),
        "content": request.get("content"),
        "month": request.get("month"),
        "semester": request.get("semester"),
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow(),
        "published_date": datetime.utcnow(),
        "status": "published"
    }
    
    result = await db.newsletter.insert_one(newsletter_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Newsletter published successfully"
    }

@router.delete("/api/newsletter/{newsletter_id}")
async def delete_newsletter_alias(
    newsletter_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: DELETE /api/newsletter/{id} -> /api/faculty/newsletters/{id}"""
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(newsletter_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid newsletter ID")
    
    newsletter = await db.newsletter.find_one({"_id": obj_id})
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    if newsletter.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this newsletter")
    
    await db.newsletter.delete_one({"_id": obj_id})
    return {"message": "Newsletter deleted successfully"}

@router.get("/api/achievements")
async def get_achievements_alias(current_user: dict = Depends(get_faculty_user)):
    """Alias: /api/achievements -> /api/faculty/achievements"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        return []
    
    achievements = await db.achievements.find({
        "department": department,
        "created_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(a["_id"]),
            "title": a.get("title"),
            "description": a.get("description"),
            "category": a.get("category"),
            "image_url": a.get("image_url"),
            "created_at": a.get("created_at")
        }
        for a in achievements
    ]

@router.post("/api/achievements")
async def create_achievements_alias(
    request: dict,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: POST /api/achievements -> /api/faculty/achievements"""
    from datetime import datetime
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    achievement_doc = {
        "title": request.get("title"),
        "description": request.get("description"),
        "category": request.get("category"),
        "image_url": request.get("image_url"),
        "department": department,
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user.get("name"),
        "created_at": datetime.utcnow()
    }
    
    result = await db.achievements.insert_one(achievement_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Achievement created successfully"
    }

@router.delete("/api/achievements/{achievement_id}")
async def delete_achievements_alias(
    achievement_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: DELETE /api/achievements/{id} -> /api/faculty/achievements/{id}"""
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(achievement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    achievement = await db.achievements.find_one({"_id": obj_id})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    if achievement.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this achievement")
    
    await db.achievements.delete_one({"_id": obj_id})
    return {"message": "Achievement deleted successfully"}

@router.get("/api/gallery")
async def get_gallery_alias(current_user: dict = Depends(get_faculty_user)):
    """Alias: /api/gallery -> /api/faculty/gallery"""
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

@router.post("/api/gallery")
async def create_gallery_alias(
    request: dict,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: POST /api/gallery -> /api/faculty/gallery"""
    from datetime import datetime
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Faculty department not set")
    
    gallery_doc = {
        "title": request.get("title"),
        "description": request.get("description"),
        "image_url": request.get("image_url"),
        "category": request.get("category"),
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

@router.delete("/api/gallery/{gallery_id}")
async def delete_gallery_alias(
    gallery_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Alias: DELETE /api/gallery/{id} -> /api/faculty/gallery/{id}"""
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        obj_id = ObjectId(gallery_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid gallery ID")
    
    gallery_item = await db.gallery.find_one({"_id": obj_id})
    if not gallery_item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    
    if gallery_item.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    await db.gallery.delete_one({"_id": obj_id})
    return {"message": "Gallery item deleted successfully"}
