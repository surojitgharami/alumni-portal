from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_faculty_user

router = APIRouter(prefix="/faculty/events", tags=["faculty-events"])


class EventCreateRequest(BaseModel):
    title: str
    description: str
    event_date: datetime
    location: str
    event_type: str = "Offline"
    is_paid: bool = False
    fee_amount: int = 0
    image: Optional[str] = None


class EventUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    event_type: Optional[str] = None


@router.get("")
async def list_faculty_events(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_faculty_user)
):
    """List events for faculty's department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    
    query = {"department": department}
    if status_filter:
        query["status"] = status_filter
    
    events = await db.events.find(query).sort("created_at", -1).to_list(None)
    
    result = []
    for e in events:
        result.append({
            "id": str(e["_id"]),
            "title": e.get("title", ""),
            "description": e.get("description", ""),
            "event_date": str(e.get("event_date")) if e.get("event_date") else "",
            "location": e.get("location", ""),
            "event_type": e.get("event_type", "Offline"),
            "status": e.get("status", "pending"),
            "created_by": str(e.get("created_by")) if e.get("created_by") else "",
            "approved": e.get("approved", False),
            "created_at": str(e.get("created_at")) if e.get("created_at") else ""
        })
    
    return result


@router.post("")
async def create_faculty_event(
    request: EventCreateRequest,
    current_user: dict = Depends(get_faculty_user)
):
    """Create event (faculty for their department)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    department = current_user.get("department")
    
    event = {
        "title": request.title,
        "description": request.description,
        "event_date": request.event_date,
        "location": request.location,
        "event_type": request.event_type,
        "is_paid": request.is_paid,
        "fee_amount": request.fee_amount,
        "department": department,
        "created_by": ObjectId(str(current_user["_id"])),
        "created_by_role": "faculty",
        "status": "approved",
        "approved": True,
        "image": request.image or "",
        "attendees": [],
        "created_at": datetime.utcnow()
    }
    
    result = await db.events.insert_one(event)
    
    return {
        "id": str(result.inserted_id),
        "message": "Event created and pending admin approval"
    }


@router.patch("/{event_id}")
async def update_faculty_event(
    event_id: str,
    request: EventUpdateRequest,
    current_user: dict = Depends(get_faculty_user)
):
    """Update event (faculty can only update own events in pending status)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check permissions: faculty can only edit own events in pending status
    if str(event.get("created_by")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if event.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Can only edit pending events")
    
    update_data = {}
    if request.title:
        update_data["title"] = request.title
    if request.description:
        update_data["description"] = request.description
    if request.event_date:
        update_data["event_date"] = request.event_date
    if request.location:
        update_data["location"] = request.location
    if request.event_type:
        update_data["event_type"] = request.event_type
    
    await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    
    return {"message": "Event updated"}


@router.post("/{event_id}/approve")
async def approve_event(
    event_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Faculty approves event in their department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Faculty can only approve events from their department that are pending
    if event.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Can only approve events in your department")
    
    # Only approve if pending
    if event.get("status") == "approved":
        return {"message": "Event already approved"}
    
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"status": "approved", "approved": True}}
    )
    
    return {"message": "Event approved"}


@router.post("/{event_id}/reject")
async def reject_event(
    event_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Faculty rejects event in their department"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.get("department") != current_user.get("department"):
        raise HTTPException(status_code=403, detail="Can only reject events in your department")
    
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Event rejected"}


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_faculty_user)
):
    """Delete event (only if created by faculty)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only allow deletion by the event creator
    if str(event.get("created_by")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Can only delete events you created")
    
    await db.events.delete_one({"_id": ObjectId(event_id)})
    
    return {"message": "Event deleted"}
