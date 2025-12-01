from datetime import datetime
from bson import ObjectId
from .db import get_database
from .core.security import get_password_hash
from typing import Optional
from fastapi import HTTPException, status
import uuid


async def get_student_master_record(registration_number: str, department: str, passout_year: int):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    record = await db.student_master.find_one({
        "registration_number": registration_number,
        "department": department,
        "passout_year": passout_year,
        "status": "active"
    })
    return record


async def check_user_exists(email: Optional[str] = None, registration_number: Optional[str] = None):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    query = {}
    if email:
        query["email"] = email
    if registration_number:
        query["registration_number"] = registration_number
    
    if query:
        user = await db.users.find_one({"$or": [{k: v} for k, v in query.items()]})
        return user is not None
    return False


async def create_user(user_data: dict):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    current_year = datetime.now().year
    passout_year = user_data["passout_year"]
    
    if passout_year <= current_year:
        role = "alumni"
    else:
        role = "student"
    
    user_doc = {
        "name": user_data["name"],
        "dob": datetime.combine(user_data["dob"], datetime.min.time()),
        "department": user_data["department"],
        "phone": user_data["phone"],
        "email": user_data["email"],
        "registration_number": user_data["registration_number"],
        "passout_year": user_data["passout_year"],
        "password_hash": get_password_hash(user_data["password"]),
        "role": role,
        "membership_status": "unpaid",
        "joined_at": datetime.utcnow(),
        "upgraded_to_alumni_at": datetime.utcnow() if role == "alumni" else None
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return user_doc


async def get_user_by_email(email: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    return await db.users.find_one({"email": email})


async def get_user_by_id(user_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    return await db.users.find_one({"_id": ObjectId(user_id)})


async def update_user(user_id: str, update_data: dict):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    
    forbidden_fields = ["registration_number", "passout_year", "password_hash", "role", "_id"]
    for field in forbidden_fields:
        update_data.pop(field, None)
    
    if not update_data:
        return None
    
    if "dob" in update_data and update_data["dob"]:
        update_data["dob"] = datetime.combine(update_data["dob"], datetime.min.time())
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return await get_user_by_id(user_id)
    return None


async def update_membership_status(user_id: str, membership_status: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"membership_status": membership_status}}
    )


async def create_payment_record(payment_data: dict):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    payment_doc = {
        "user_id": ObjectId(payment_data["user_id"]),
        "order_id": payment_data["order_id"],
        "payment_id": payment_data.get("payment_id"),
        "amount": payment_data["amount"],
        "currency": payment_data.get("currency", "INR"),
        "purpose": payment_data["purpose"],
        "status": payment_data.get("status", "created"),
        "metadata": payment_data.get("metadata", {}),
        "raw": payment_data.get("raw", {}),
        "created_at": datetime.utcnow()
    }
    result = await db.payments.insert_one(payment_doc)
    payment_doc["_id"] = result.inserted_id
    return payment_doc


async def update_payment_status(order_id: str, payment_id: str, status_value: str, raw: Optional[dict] = None):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    update_data: dict = {"status": status_value, "payment_id": payment_id}
    if raw:
        update_data["raw"] = raw
    
    await db.payments.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )


async def get_payment_by_order_id(order_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    return await db.payments.find_one({"order_id": order_id})


async def create_event(event_data: dict, created_by: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    event_doc = {
        "title": event_data["title"],
        "department": event_data.get("department", "All"),
        "description": event_data["description"],
        "event_date": event_data["event_date"],
        "location": event_data["location"],
        "is_paid": event_data.get("is_paid", False),
        "fee_amount": event_data.get("fee_amount", 0),
        "created_by": ObjectId(created_by),
        "approved": False,
        "attendees": [],
        "created_at": datetime.utcnow()
    }
    result = await db.events.insert_one(event_doc)
    event_doc["_id"] = result.inserted_id
    return event_doc


async def get_events(approved_only: bool = True):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    query = {"approved": True} if approved_only else {}
    cursor = db.events.find(query).sort("created_at", -1)
    return await cursor.to_list(length=100)


async def get_event_by_id(event_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    return await db.events.find_one({"_id": ObjectId(event_id)})


async def register_for_event(event_id: str, user_id: str, payment_status: str = "free"):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    ticket_id = str(uuid.uuid4())
    
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$push": {
            "attendees": {
                "user_id": ObjectId(user_id),
                "ticket_id": ticket_id,
                "payment_status": payment_status,
                "registered_at": datetime.utcnow()
            }
        }}
    )
    return ticket_id


async def approve_event(event_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"approved": True}}
    )


async def create_job(job_data: dict, created_by: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    job_doc = {
        "title": job_data["title"],
        "company": job_data["company"],
        "description": job_data["description"],
        "location": job_data["location"],
        "job_type": job_data.get("job_type", "full-time"),
        "salary_range": job_data.get("salary_range"),
        "application_link": job_data.get("application_link"),
        "created_by": ObjectId(created_by),
        "approved": False,
        "created_at": datetime.utcnow()
    }
    result = await db.jobs.insert_one(job_doc)
    job_doc["_id"] = result.inserted_id
    return job_doc


async def get_jobs(approved_only: bool = True):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    query = {"approved": True} if approved_only else {}
    cursor = db.jobs.find(query).sort("created_at", -1)
    return await cursor.to_list(length=100)


async def get_job_by_id(job_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    return await db.jobs.find_one({"_id": ObjectId(job_id)})


async def approve_job(job_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"approved": True}}
    )


async def upgrade_students_to_alumni():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
    current_year = datetime.now().year
    
    result = await db.users.update_many(
        {
            "role": "student",
            "passout_year": {"$lte": current_year}
        },
        {
            "$set": {
                "role": "alumni",
                "upgraded_to_alumni_at": datetime.utcnow()
            }
        }
    )
    return result.modified_count
