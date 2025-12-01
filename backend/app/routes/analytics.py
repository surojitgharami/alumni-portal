from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from ..db import get_database
from ..deps import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def get_analytics_dashboard(
    current_user = Depends(get_current_user)
):
    """Get analytics dashboard (admin only)"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    total_alumni = await db.users.count_documents({"role": "alumni"})
    active_members = await db.users.count_documents({"role": "alumni", "membership_status": "active"})
    total_students = await db.users.count_documents({"role": "student"})
    total_events = await db.events.count_documents({})
    total_jobs = await db.jobs.count_documents({})

    # Revenue from payments
    payments = await db.payments.find({"status": "completed"}).to_list(None)
    total_revenue = sum(p.get("amount", 0) for p in payments)

    # Daily active users (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_active = await db.users.count_documents({
        "last_login": {"$gte": seven_days_ago}
    })

    # Alumni by year
    alumni_by_year = await db.users.aggregate([
        {"$match": {"role": "alumni"}},
        {"$group": {"_id": "$passout_year", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(None)

    # Events by month
    events_by_month = await db.events.aggregate([
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)

    # Jobs by department
    jobs_by_dept = await db.jobs.aggregate([
        {"$lookup": {"from": "users", "localField": "created_by", "foreignField": "_id", "as": "user"}},
        {"$group": {"_id": "$user.department", "count": {"$sum": 1}}}
    ]).to_list(None)

    return {
        "total_alumni": total_alumni,
        "active_members": active_members,
        "total_students": total_students,
        "total_events": total_events,
        "total_jobs": total_jobs,
        "total_revenue": total_revenue / 100,  # Convert paise to rupees
        "daily_active_users": daily_active,
        "alumni_by_year": {str(item["_id"]): item["count"] for item in alumni_by_year},
        "events_by_month": {f"{item['_id']['year']}-{item['_id']['month']}": item["count"] for item in events_by_month},
        "jobs_by_department": {str(item["_id"]): item["count"] for item in jobs_by_dept}
    }


@router.get("/members")
async def get_membership_analytics(
    current_user = Depends(get_current_user)
):
    """Get membership analytics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    total_payments = await db.payments.count_documents({"status": "completed"})
    successful_payments = await db.payments.count_documents({"status": "completed"})
    failed_payments = await db.payments.count_documents({"status": "failed"})

    payment_amounts = await db.payments.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "avg": {"$avg": "$amount"}}}
    ]).to_list(None)

    total_revenue = payment_amounts[0]["total"] if payment_amounts else 0
    avg_payment = payment_amounts[0]["avg"] if payment_amounts else 0

    return {
        "total_payments": total_payments,
        "successful_payments": successful_payments,
        "failed_payments": failed_payments,
        "total_revenue": total_revenue / 100,
        "average_payment": avg_payment / 100,
        "conversion_rate": (successful_payments / total_payments * 100) if total_payments > 0 else 0
    }
