from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..models import NotificationResponse, Notification
from ..db import get_database
from ..deps import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user = Depends(get_current_user)
):
    """Get user notifications"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    query = {"user_id": str(current_user["_id"])}
    if unread_only:
        query["read"] = False

    notifications = await db.notifications.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(None)

    return [
        NotificationResponse(
            id=str(n["_id"]),
            title=n["title"],
            message=n["message"],
            notification_type=n["notification_type"],
            read=n.get("read", False),
            created_at=n["created_at"]
        )
        for n in notifications
    ]


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mark notification as read"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": str(current_user["_id"])},
        {"$set": {"read": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"status": "marked as read"}


@router.get("/unread-count")
async def get_unread_count(
    current_user = Depends(get_current_user)
):
    """Get count of unread notifications"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    count = await db.notifications.count_documents({
        "user_id": str(current_user["_id"]),
        "read": False
    })

    return {"unread_count": count}
