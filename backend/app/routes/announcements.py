from fastapi import APIRouter, HTTPException, status
from ..db import get_database

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("")
async def get_announcements():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")

    announcements = await db.announcements.find({}).sort("created_at", -1).to_list(length=50)
    return [{
        "_id": str(a["_id"]),
        "title": a["title"],
        "content": a["content"],
        "created_at": a["created_at"]
    } for a in announcements]
