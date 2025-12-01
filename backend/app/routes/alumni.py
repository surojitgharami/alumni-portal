from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from ..models import AlumniDirectoryResponse
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/alumni", tags=["alumni"])


@router.get("/directory", response_model=list[AlumniDirectoryResponse])
async def get_alumni_directory(
    department: Optional[str] = None,
    passout_year: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get alumni directory with filters"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    from datetime import datetime
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Build base query - ONLY show users who have truly graduated
    # NO users with future passout years should appear (passout_year > current_year)
    # Students appear if:
    #   - passout_year < current_year (already graduated), OR
    #   - passout_year == current_year AND current_month > 6 (after June graduation)
    # Alumni appear regardless of role, but NEVER if passout_year is in the future
    
    if current_month > 6:
        # After June - show users graduating this year and before
        condition = {
            "$and": [
                {"passout_year": {"$lte": current_year}},
                {
                    "$or": [
                        {"role": "alumni"},
                        {"$and": [{"role": "student"}, {"passout_year": {"$lte": current_year}}]}
                    ]
                }
            ]
        }
    else:
        # Before/during June - show users from past years only
        condition = {
            "$and": [
                {"passout_year": {"$lt": current_year}},
                {
                    "$or": [
                        {"role": "alumni"},
                        {"role": "student"}
                    ]
                }
            ]
        }
    
    and_conditions = [condition]

    # Add department filter
    if department:
        and_conditions.append({"department": department})

    # Add passout_year filter
    if passout_year:
        and_conditions.append({"passout_year": passout_year})

    # Add search filter
    if search:
        and_conditions.append({
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"current_company": {"$regex": search, "$options": "i"}},
                {"current_position": {"$regex": search, "$options": "i"}}
            ]
        })

    # Build final query
    if len(and_conditions) == 1:
        query = and_conditions[0]
    else:
        query = {"$and": and_conditions}

    alumni = await db.users.find(query).skip(skip).limit(limit).to_list(None)

    return [
        AlumniDirectoryResponse(
            id=str(a["_id"]),
            name=a["name"],
            department=a["department"],
            passout_year=a["passout_year"],
            current_company=a.get("current_company"),
            current_position=a.get("current_position"),
            email=a["email"],
            profile_photo_url=a.get("profile_photo_url"),
            location=a.get("location"),
            gender=a.get("gender"),
            professional=a.get("professional", {
                "workplace": a.get("current_company"),
                "designation": a.get("current_position"),
                "industry": a.get("industry"),
                "skills": a.get("skills", [])
            })
        )
        for a in alumni
    ]


@router.get("/stats")
async def get_alumni_stats(
    current_user = Depends(get_current_user)
):
    """Get alumni statistics"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    total_alumni = await db.users.count_documents({"role": "alumni"})
    active_members = await db.users.count_documents({"role": "alumni", "membership_status": "active"})
    by_department = await db.users.aggregate([
        {"$match": {"role": "alumni"}},
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)

    return {
        "total_alumni": total_alumni,
        "active_members": active_members,
        "by_department": {item["_id"]: item["count"] for item in by_department}
    }
