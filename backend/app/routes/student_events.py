from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/student/events", tags=["student-events"])

class EventProposalCreate(BaseModel):
    title: str
    description: str
    event_date: datetime
    location: str

@router.post("/propose")
async def propose_event(request: EventProposalCreate, current_user: dict = Depends(get_current_user)):
    """Student proposes new event for faculty approval"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can propose events")
    
    department = current_user.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="Department not set")
    
    proposal_doc = {
        "title": request.title,
        "description": request.description,
        "event_date": request.event_date,
        "location": request.location,
        "department": department,
        "proposed_by": str(current_user["_id"]),
        "proposed_by_name": current_user.get("name"),
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.event_proposals.insert_one(proposal_doc)
    return {
        "id": str(result.inserted_id),
        "message": "Event proposal submitted for faculty approval"
    }

@router.get("/my-proposals")
async def get_my_proposals(current_user: dict = Depends(get_current_user)):
    """Get student's event proposals"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    proposals = await db.event_proposals.find({
        "proposed_by": str(current_user["_id"])
    }).sort("created_at", -1).to_list(None)
    
    return [
        {
            "id": str(p["_id"]),
            "title": p.get("title"),
            "description": p.get("description"),
            "event_date": p.get("event_date"),
            "status": p.get("status"),
            "created_at": p.get("created_at")
        }
        for p in proposals
    ]
