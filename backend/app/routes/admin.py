from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from ..models import AdminLoginRequest, TokenResponse, UserResponse, EventResponse, JobResponse
from ..core.settings import settings
from ..core.security import verify_password, create_access_token
from ..deps import get_current_admin
from ..crud import (
    get_events, get_jobs, approve_event, approve_job,
    upgrade_students_to_alumni
)
from ..db import get_database
from datetime import datetime
import csv
import json
import io
import pandas as pd

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login")
async def admin_login(request: AdminLoginRequest):
    if request.email != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    if not settings.ADMIN_PASSWORD_HASH:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin account not configured"
        )
    
    if not verify_password(request.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    token = create_access_token(data={"sub": "admin", "role": "admin", "email": request.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": "admin",
            "email": settings.ADMIN_EMAIL,
            "role": "admin",
            "name": "Administrator"
        }
    }


@router.get("/dashboard")
async def admin_dashboard(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    total_users = await db.users.count_documents({})
    students_count = await db.users.count_documents({"role": "student"})
    alumni_count = await db.users.count_documents({"role": "alumni"})
    active_members = await db.users.count_documents({"membership_status": "active"})
    
    pending_events = await db.events.count_documents({"approved": False})
    pending_jobs = await db.jobs.count_documents({"approved": False})
    
    total_payments = await db.payments.count_documents({"status": "captured"})
    
    pipeline = [
        {"$match": {"status": "captured"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payments.aggregate(pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "stats": {
            "total_users": total_users,
            "students": students_count,
            "alumni": alumni_count,
            "active_members": active_members,
            "pending_events": pending_events,
            "pending_jobs": pending_jobs,
            "total_payments": total_payments,
            "total_revenue": total_revenue / 100
        }
    }


@router.get("/pending-events")
async def get_pending_events(admin: dict = Depends(get_current_admin)):
    events = await get_events(approved_only=False)
    pending = [e for e in events if not e.get("approved")]
    
    return [{
        "id": str(e["_id"]),
        "title": e["title"],
        "department": e["department"],
        "description": e["description"],
        "event_date": e["event_date"],
        "location": e["location"],
        "is_paid": e["is_paid"],
        "fee_amount": e["fee_amount"],
        "created_at": e["created_at"]
    } for e in pending]


@router.patch("/events/{event_id}/approve")
async def approve_event_admin(event_id: str, admin: dict = Depends(get_current_admin)):
    from ..crud import get_event_by_id
    from ..services.email_service import send_email
    
    event = await get_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    await approve_event(event_id)
    
    # Send notifications to all alumni (non-blocking)
    try:
        db = get_database()
        if db is not None:
            alumni = await db.users.find({"role": {"$in": ["alumni", "student"]}}).to_list(None)
            event_date = event.get("event_date", "TBD")
            if isinstance(event_date, datetime):
                event_date = event_date.strftime("%B %d, %Y")
            
            email_html = f"""
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
                    try:
                        # Send email
                        await send_email(alumni_member["email"], f"New Event: {event['title']}", email_html)
                        
                        # Create notification record
                        await db.notifications.insert_one({
                            "user_id": str(alumni_member["_id"]),
                            "title": f"New Event: {event['title']}",
                            "message": event['description'][:200],
                            "notification_type": "event",
                            "read": False,
                            "created_at": datetime.utcnow()
                        })
                    except Exception as e:
                        print(f"Error sending notification to {alumni_member.get('email')}: {str(e)}")
                        continue
    except Exception as e:
        print(f"Error in event notification process: {str(e)}")
    
    return {"success": True, "message": "Event approved successfully"}


@router.get("/pending-jobs")
async def get_pending_jobs(admin: dict = Depends(get_current_admin)):
    jobs = await get_jobs(approved_only=False)
    pending = [j for j in jobs if not j.get("approved")]
    
    return [{
        "id": str(j["_id"]),
        "title": j["title"],
        "company": j["company"],
        "description": j["description"],
        "location": j["location"],
        "job_type": j["job_type"],
        "created_at": j["created_at"]
    } for j in pending]


@router.patch("/jobs/{job_id}/approve")
async def approve_job_admin(job_id: str, admin: dict = Depends(get_current_admin)):
    from ..crud import get_job_by_id
    from ..services.email_service import send_email
    
    job = await get_job_by_id(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    await approve_job(job_id)
    
    # Send notifications to all alumni (non-blocking)
    try:
        db = get_database()
        if db is not None:
            alumni = await db.users.find({"role": {"$in": ["alumni", "student"]}}).to_list(None)
            
            email_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>New Job Opportunity! 💼</h2>
                    <p>Hi,</p>
                    <p>A new job has been posted on our portal:</p>
                    <p><strong>{job['title']}</strong> at <strong>{job['company']}</strong></p>
                    <p><strong>Location:</strong> {job.get('location', 'TBD')}</p>
                    <p><strong>Type:</strong> {job.get('job_type', 'TBD')}</p>
                    <p>{job['description']}</p>
                    <p>Log in to your dashboard to view details and apply.</p>
                    <p>Best regards,<br>Alumni Portal Team</p>
                </body>
            </html>
            """
            
            for alumni_member in alumni:
                if alumni_member.get("email"):
                    try:
                        # Send email
                        await send_email(alumni_member["email"], f"New Job: {job['title']} at {job['company']}", email_html)
                        
                        # Create notification record
                        await db.notifications.insert_one({
                            "user_id": str(alumni_member["_id"]),
                            "title": f"New Job: {job['title']}",
                            "message": f"{job['company']} - {job['description'][:100]}",
                            "notification_type": "job",
                            "read": False,
                            "created_at": datetime.utcnow()
                        })
                    except Exception as e:
                        print(f"Error sending notification to {alumni_member.get('email')}: {str(e)}")
                        continue
    except Exception as e:
        print(f"Error in job notification process: {str(e)}")
    
    return {"success": True, "message": "Job approved successfully"}


@router.get("/users")
async def list_users(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    users = await db.users.find({}).sort("joined_at", -1).to_list(length=500)
    
    return [{
        "id": str(u["_id"]),
        "name": u.get("name", ""),
        "email": u.get("email", ""),
        "department": u.get("department", ""),
        "registration_number": u.get("registration_number", ""),
        "passout_year": u.get("passout_year", 0),
        "role": u.get("role", ""),
        "membership_status": u.get("membership_status", "unpaid"),
        "joined_at": u.get("joined_at")
    } for u in users]


@router.post("/users")
async def add_user(data: dict, admin: dict = Depends(get_current_admin)):
    """Add a new alumni or next year passout student"""
    from bson import ObjectId
    from ..core.security import get_password_hash
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    # Validate required fields
    required_fields = ["name", "email", "department", "registration_number", "passout_year", "role"]
    for field in required_fields:
        if not data.get(field):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required field: {field}")
    
    # Check if user already exists
    existing = await db.users.find_one({"email": data["email"]})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")
    
    # Generate temp password
    temp_password = f"{data.get('registration_number', 'temp')}123"
    
    user_doc = {
        "_id": ObjectId(),
        "name": data["name"],
        "email": data["email"],
        "department": data["department"],
        "registration_number": data["registration_number"],
        "passout_year": int(data["passout_year"]),
        "phone": data.get("phone", ""),
        "dob": data.get("dob"),
        "role": data["role"],  # "alumni" or "student"
        "password_hash": get_password_hash(temp_password),
        "membership_status": "unpaid",
        "joined_at": datetime.utcnow(),
        "status": "approved"
    }
    
    result = await db.users.insert_one(user_doc)
    
    return {
        "success": True,
        "message": f"User added successfully",
        "id": str(result.inserted_id),
        "temporary_password": temp_password,
        "user": {
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "passout_year": user_doc["passout_year"]
        }
    }


@router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict, admin: dict = Depends(get_current_admin)):
    """Update an existing alumni or student - regenerates temp password"""
    from bson import ObjectId
    from ..core.security import get_password_hash
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    existing_user = await db.users.find_one({"_id": user_obj_id})
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Generate new temp password
    reg_num = data.get("registration_number", existing_user.get("registration_number", "temp"))
    temp_password = f"{reg_num}123"
    
    update_data = {
        "name": data.get("name", existing_user.get("name")),
        "email": data.get("email", existing_user.get("email")),
        "department": data.get("department", existing_user.get("department")),
        "registration_number": data.get("registration_number", existing_user.get("registration_number")),
        "passout_year": int(data.get("passout_year", existing_user.get("passout_year"))),
        "phone": data.get("phone", existing_user.get("phone", "")),
        "dob": data.get("dob", existing_user.get("dob")),
        "password_hash": get_password_hash(temp_password),
        "role": data.get("role", existing_user.get("role"))
    }
    
    await db.users.update_one(
        {"_id": user_obj_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "User updated successfully",
        "id": user_id,
        "temporary_password": temp_password,
        "user": {
            "name": update_data["name"],
            "email": update_data["email"],
            "role": update_data["role"],
            "passout_year": update_data["passout_year"]
        }
    }


@router.get("/payments")
async def list_payments(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    payments = await db.payments.find({}).sort("created_at", -1).to_list(length=500)
    
    return [{
        "id": str(p["_id"]),
        "user_id": str(p["user_id"]),
        "order_id": p["order_id"],
        "payment_id": p.get("payment_id"),
        "amount": p["amount"] / 100,
        "currency": p.get("currency", "INR"),
        "purpose": p["purpose"],
        "status": p["status"],
        "created_at": p["created_at"]
    } for p in payments]


@router.post("/cron/upgrade-students")
async def run_upgrade_students(admin: dict = Depends(get_current_admin)):
    upgraded_count = await upgrade_students_to_alumni()
    return {
        "success": True,
        "message": f"Upgraded {upgraded_count} students to alumni status"
    }


@router.post("/uploadstudentdata")
async def upload_student_data(file: UploadFile = File(...), overwrite: bool = True, admin: dict = Depends(get_current_admin)):
    """Upload student master data from CSV/XLSX/JSON file"""
    allowed_extensions = {'.csv', '.xlsx', '.xls', '.svs', '.json'}
    file_ext = '.' + file.filename.split('.')[-1].lower() if file.filename and '.' in file.filename else ''
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        content = await file.read()
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        errors = []
        records = []
        
        if file_ext in {'.csv', '.svs'}:
            text_content = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(text_content))
            records = list(reader)
        elif file_ext in {'.xlsx', '.xls'}:
            df = pd.read_excel(io.BytesIO(content))
            records = df.to_dict('records')
        elif file_ext == '.json':
            records = json.loads(content.decode('utf-8'))
        
        required_columns = {'registration_number', 'name', 'department', 'passout_year'}
        if records and isinstance(records[0], dict):
            missing = required_columns - set(records[0].keys())
            if missing:
                return {
                    "status": "error",
                    "errors": [f"Missing columns: {', '.join(missing)}"]
                }
        
        valid_records = []
        duplicate_count = 0
        allowed_departments = {'CSE', 'ECE', 'ME', 'EE', 'CE', 'BT'}
        
        for idx, record in enumerate(records, 1):
            try:
                reg_num = str(record.get('registration_number', '')).strip()
                name = str(record.get('name', '')).strip()
                dept = str(record.get('department', '')).strip().upper()
                year = int(record.get('passout_year', 0))
                
                if not all([reg_num, name, dept, year]):
                    errors.append(f"Row {idx}: Missing required fields")
                    continue
                
                if dept not in allowed_departments:
                    errors.append(f"Row {idx}: Invalid department '{dept}'")
                    continue
                
                if year < 2000 or year > 2050:
                    errors.append(f"Row {idx}: Invalid passout year '{year}'")
                    continue
                
                valid_records.append({
                    "registration_number": reg_num,
                    "name": name,
                    "department": dept,
                    "passout_year": year,
                    "status": "active",
                    "created_at": datetime.utcnow()
                })
            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
        
        if overwrite:
            await db.student_master.delete_many({})
        
        imported_count = 0
        for record in valid_records:
            existing = await db.student_master.find_one({
                "registration_number": record["registration_number"]
            })
            if existing:
                duplicate_count += 1
            else:
                await db.student_master.insert_one(record)
                imported_count += 1
        
        return {
            "status": "success",
            "records_imported": imported_count,
            "duplicates_skipped": duplicate_count,
            "errors": errors
        }
    except Exception as e:
        return {
            "status": "error",
            "errors": [f"File processing error: {str(e)}"]
        }


# ============== NEW ADMIN FEATURES ==============

@router.get("/alumni")
async def list_alumni(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    alumni = await db.users.find({"role": "alumni"}).sort("joined_at", -1).to_list(length=500)
    return [{
        "_id": str(a["_id"]),
        "name": a["name"],
        "email": a["email"],
        "department": a["department"],
        "passout_year": a["passout_year"],
        "phone": a.get("phone", ""),
        "membership_status": a["membership_status"]
    } for a in alumni]


@router.delete("/alumni/{alumni_id}")
async def delete_alumni(alumni_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.users.delete_one({"_id": ObjectId(alumni_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return {"success": True, "message": "Alumni deleted successfully"}


@router.get("/registrations")
async def list_pending_registrations(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    regs = await db.users.find({"status": "pending"}).to_list(length=500)
    return [{
        "_id": str(r["_id"]),
        "name": r["name"],
        "email": r["email"],
        "registration_number": r["registration_number"],
        "department": r["department"],
        "passout_year": r["passout_year"],
        "status": r.get("status", "pending")
    } for r in regs]


@router.post("/registrations/{reg_id}/approve")
async def approve_registration(reg_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.users.update_one({"_id": ObjectId(reg_id)}, {"$set": {"status": "approved"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"success": True, "message": "Registration approved"}


@router.post("/registrations/{reg_id}/reject")
async def reject_registration(reg_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.users.delete_one({"_id": ObjectId(reg_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"success": True, "message": "Registration rejected"}


@router.get("/events-list")
async def list_all_events(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    events = await db.events.find({}).sort("created_at", -1).to_list(length=500)
    return [{
        "_id": str(e["_id"]),
        "title": e["title"],
        "description": e["description"],
        "event_date": e["event_date"],
        "location": e.get("location", "TBD"),
        "event_type": e.get("event_type", "Offline"),
        "department": e["department"],
        "is_paid": e.get("is_paid", False),
        "fee_amount": e.get("fee_amount", 0),
        "approved": e.get("approved", False),
        "image": e.get("image"),
        "attendees_count": len(e.get("attendees", []))
    } for e in events]


@router.post("/events")
async def create_event(event: dict, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    event_doc = {
        "title": event.get("title"),
        "description": event.get("description"),
        "event_date": event.get("event_date"),
        "location": event.get("location", "TBD"),
        "event_type": event.get("event_type", "Offline"),
        "department": event.get("department", "All"),
        "is_paid": event.get("is_paid", False),
        "fee_amount": event.get("fee_amount", 0),
        "image": event.get("image"),
        "approved": True,
        "created_by": "admin",
        "created_at": datetime.utcnow(),
        "attendees": []
    }
    result = await db.events.insert_one(event_doc)
    return {"success": True, "id": str(result.inserted_id)}


@router.delete("/events/{event_id}")
async def delete_event(event_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": "Event deleted"}


@router.patch("/events/{event_id}")
async def update_event(event_id: str, event_data: dict, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    update_data = {k: v for k, v in event_data.items() if v is not None}
    result = await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": "Event updated"}


@router.get("/jobs-list")
async def list_all_jobs(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    jobs = await db.jobs.find({}).sort("created_at", -1).to_list(length=500)
    return [{
        "_id": str(j["_id"]),
        "title": j["title"],
        "company": j["company"],
        "location": j["location"],
        "job_type": j["job_type"],
        "description": j["description"],
        "approved": j.get("approved", False)
    } for j in jobs]


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted"}


@router.get("/announcements")
async def list_announcements(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    announcements = await db.announcements.find({}).sort("created_at", -1).to_list(length=500)
    return [{
        "_id": str(a["_id"]),
        "title": a["title"],
        "content": a["content"],
        "created_at": a["created_at"]
    } for a in announcements]


@router.post("/announcements")
async def create_announcement(announcement: dict, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    ann_doc = {
        "title": announcement.get("title"),
        "content": announcement.get("content"),
        "created_at": datetime.utcnow()
    }
    result = await db.announcements.insert_one(ann_doc)
    return {"success": True, "id": str(result.inserted_id)}


@router.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.announcements.delete_one({"_id": ObjectId(ann_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"success": True, "message": "Announcement deleted"}


@router.get("/homepage-content")
async def get_homepage_content(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    content = await db.settings.find_one({"type": "homepage"})
    if not content:
        return {
            "hero_title": "Welcome to Alumni Portal",
            "hero_subtitle": "Connect with your alumni network",
            "hero_image_url": "",
            "features": [],
            "footer_text": ""
        }
    return {
        "_id": str(content.get("_id")),
        "hero_title": content.get("hero_title", ""),
        "hero_subtitle": content.get("hero_subtitle", ""),
        "hero_image_url": content.get("hero_image_url", ""),
        "features": content.get("features", []),
        "footer_text": content.get("footer_text", "")
    }


@router.put("/homepage-content")
async def update_homepage_content(content: dict, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    await db.settings.update_one(
        {"type": "homepage"},
        {
            "$set": {
                "hero_title": content.get("hero_title"),
                "hero_subtitle": content.get("hero_subtitle"),
                "hero_image_url": content.get("hero_image_url"),
                "features": content.get("features", []),
                "footer_text": content.get("footer_text"),
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    return {"success": True, "message": "Homepage content updated"}


@router.get("/gallery")
async def list_gallery(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    items = await db.gallery.find({}).sort("created_at", -1).to_list(length=500)
    return [{
        "_id": str(i["_id"]),
        "title": i["title"],
        "image_url": i["image_url"],
        "description": i.get("description", ""),
        "created_at": i["created_at"]
    } for i in items]


@router.post("/gallery")
async def add_gallery_item(item: dict, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    gallery_doc = {
        "title": item.get("title"),
        "image_url": item.get("image_url"),
        "description": item.get("description", ""),
        "created_at": datetime.utcnow()
    }
    result = await db.gallery.insert_one(gallery_doc)
    return {"success": True, "id": str(result.inserted_id)}


@router.delete("/gallery/{item_id}")
async def delete_gallery_item(item_id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    from bson import ObjectId
    result = await db.gallery.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"success": True, "message": "Gallery item deleted"}


@router.get("/content/sections/{section_name}")
async def get_content_section(section_name: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")

    try:
        section = await db.content_sections.find_one({"section_name": section_name})
        if not section:
            if section_name == "donationimpact":
                return {
                    "total_donated": 5000000,
                    "scholarships_awarded": 500,
                    "events_organized": 100
                }
            return {}
        
        data = section.copy()
        data.pop("_id", None)
        data.pop("section_name", None)
        return data
    except Exception as e:
        print(f"Error fetching section {section_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch section")


@router.post("/content/sections")
async def save_content_section(data: dict, admin: dict = Depends(get_current_admin)):
    """Save content section"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    section_name = data.get("section_name")
    try:
        section_data = {k: v for k, v in data.items() if k != "section_name"}
        await db.content_sections.update_one(
            {"section_name": section_name},
            {"$set": {**section_data, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"success": True, "message": f"{section_name} saved successfully"}
    except Exception as e:
        print(f"Error saving section: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save section")


@router.get("/donations-report")
async def get_donations_report(admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    donations = await db.donations.find({"status": "completed"}).to_list(length=500)
    total_donations = len(donations)
    total_amount = sum(d["amount"] for d in donations) if donations else 0
    
    recent = await db.donations.find(
        {"status": "completed"}
    ).sort("created_at", -1).limit(20).to_list(length=20)
    
    return {
        "total_donations": total_donations,
        "total_amount": total_amount / 100,
        "recent_donations": [{
            "_id": str(d["_id"]),
            "donor_name": "Donor",
            "amount": d["amount"],
            "created_at": d["created_at"]
        } for d in recent]
    }


@router.post("/send-mass-email")
async def send_mass_email(email_data: dict, admin: dict = Depends(get_current_admin)):
    from ..services.email_service import send_email
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    subject = email_data.get("subject", "")
    content = email_data.get("content", "")
    recipient_group = email_data.get("recipient_group", "all")
    
    if not subject or not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject and content are required")
    
    if recipient_group == "all":
        query = {}
    elif recipient_group == "active":
        query = {"membership_status": "active"}
    elif recipient_group == "unpaid":
        query = {"membership_status": "unpaid"}
    else:
        query = {}
    
    recipients = await db.users.find(query).to_list(length=5000)
    sent_count = 0
    
    for user in recipients:
        email_content = content.replace("{name}", user.get("name", ""))
        email_content = email_content.replace("{email}", user["email"])
        email_content = email_content.replace("{department}", user.get("department", ""))
        
        try:
            await send_email(user["email"], subject, email_content)
            sent_count += 1
        except Exception as e:
            print(f"Failed to send email to {user['email']}: {str(e)}")
    
    return {"success": True, "sent_count": sent_count}
