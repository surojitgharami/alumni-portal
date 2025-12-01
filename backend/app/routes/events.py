from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from ..models import EventCreate, EventResponse
from ..crud import (
    create_event, get_events, get_event_by_id, register_for_event,
    get_user_by_id
)
from ..deps import get_current_user, get_alumni_with_membership, get_active_member

router = APIRouter(prefix="/events", tags=["Events"])


def event_to_response(event: dict) -> EventResponse:
    return EventResponse(
        id=str(event["_id"]),
        title=event["title"],
        department=event.get("department", "All"),
        description=event["description"],
        event_date=event["event_date"],
        location=event.get("location", "TBD"),
        event_type=event.get("event_type", "Offline"),
        is_paid=event.get("is_paid", False),
        fee_amount=event.get("fee_amount", 0),
        created_by=str(event["created_by"]),
        approved=event.get("approved", False),
        attendees_count=len(event.get("attendees", [])),
        created_at=event["created_at"],
        image=event.get("image", None)
    )


@router.get("", response_model=List[EventResponse])
async def list_events():
    # Public endpoint - show approved events to everyone
    events = await get_events(approved_only=True)
    return [event_to_response(e) for e in events]


@router.get("/all", response_model=List[EventResponse])
async def list_all_events(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    events = await get_events(approved_only=False)
    return [event_to_response(e) for e in events]


@router.post("", response_model=EventResponse)
async def create_new_event(
    request: EventCreate,
    user: dict = Depends(get_alumni_with_membership)
):
    event = await create_event(request.model_dump(), str(user["_id"]))
    
    # Send event notification to all alumni if event is approved
    if event.get("approved"):
        from ..services.email_service import send_email
        from ..db import get_database
        from datetime import datetime
        
        db = get_database()
        if db is not None:
            # Get all alumni with email
            alumni = await db.users.find({"role": {"$in": ["alumni", "student"]}}).to_list(None)
            event_date = event.get("event_date", "TBD")
            if isinstance(event_date, datetime):
                event_date = event_date.strftime("%B %d, %Y")
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>New Event: {event['title']} 📅</h2>
                    <p>Hi,</p>
                    <p>A new event has been posted!</p>
                    <p><strong>{event['title']}</strong></p>
                    <p><strong>Date:</strong> {event_date}</p>
                    <p><strong>Location:</strong> {event.get('location', 'TBD')}</p>
                    <p>{event['description']}</p>
                    <p>Log in to your dashboard to register and get more details.</p>
                    <p>See you there!<br>Alumni Portal Team</p>
                </body>
            </html>
            """
            for alumni_member in alumni:
                if alumni_member.get("email"):
                    await send_email(alumni_member["email"], f"New Event: {event['title']}", html_content)
    
    return event_to_response(event)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, user: dict = Depends(get_current_user)):
    event = await get_event_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if not event["approved"] and user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    return event_to_response(event)


@router.post("/{event_id}/register")
async def register_event(
    event_id: str,
    user: dict = Depends(get_current_user)
):
    event = await get_event_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if not event["approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register for unapproved event"
        )
    
    attendees = event.get("attendees", [])
    for attendee in attendees:
        if str(attendee["user_id"]) == str(user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already registered for this event"
            )
    
    if event["is_paid"]:
        is_faculty = user.get("role") == "faculty"
        if not is_faculty and user.get("membership_status") != "active" and user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Active membership required to register for paid events"
            )
        
        return {
            "requires_payment": True,
            "event_id": event_id,
            "amount": event["fee_amount"],
            "message": "Payment required to complete registration"
        }
    
    ticket_id = await register_for_event(event_id, str(user["_id"]), "free")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": "Successfully registered for event"
    }


@router.post("/{event_id}/complete-registration")
async def complete_paid_registration(
    event_id: str,
    user: dict = Depends(get_active_member)
):
    event = await get_event_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    attendees = event.get("attendees", [])
    for attendee in attendees:
        if str(attendee["user_id"]) == str(user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already registered for this event"
            )
    
    ticket_id = await register_for_event(event_id, str(user["_id"]), "paid")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": "Successfully registered for event"
    }
