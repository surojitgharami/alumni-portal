from fastapi import APIRouter, HTTPException, status, Depends
from ..deps import get_current_admin
from ..db import get_database
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/admin/donation-stats", tags=["Donation Stats"])

class DonationStats(BaseModel):
    total_donated: int
    scholarships_awarded: int
    events_organized: int

@router.get("")
async def get_donation_stats():
    """Get donation impact stats - public endpoint"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        stats = await db.donation_stats.find_one({"_id": "main"})
        
        if not stats:
            default_stats = {
                "total_donated": 5000000,
                "scholarships_awarded": 500,
                "events_organized": 100
            }
            return default_stats
        
        return {
            "total_donated": stats.get("total_donated", 5000000),
            "scholarships_awarded": stats.get("scholarships_awarded", 500),
            "events_organized": stats.get("events_organized", 100)
        }
    except Exception as e:
        print(f"❌ Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

@router.post("")
async def update_donation_stats(stats: DonationStats, admin: dict = Depends(get_current_admin)):
    """Update donation impact stats"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        await db.donation_stats.update_one(
            {"_id": "main"},
            {
                "$set": {
                    "total_donated": stats.total_donated,
                    "scholarships_awarded": stats.scholarships_awarded,
                    "events_organized": stats.events_organized,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        return {"success": True, "message": "Stats updated successfully"}
    except Exception as e:
        print(f"❌ Error updating stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update stats")
