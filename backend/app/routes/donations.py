from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from ..models import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from ..deps import get_current_user
from ..core.settings import settings
from ..db import get_database
from bson import ObjectId
import razorpay
import hmac
import hashlib
from datetime import datetime

router = APIRouter(prefix="/donations", tags=["Donations"])


def get_razorpay_client():
    if not settings.RZP_KEY_ID or not settings.RZP_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RZP_KEY_ID, settings.RZP_KEY_SECRET))


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_donation_order(request: CreateOrderRequest, user: dict = Depends(get_current_user)):
    """Create a Razorpay order for donation"""
    try:
        client = get_razorpay_client()
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service not configured"
            )
        
        amount = request.amount
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Donation amount must be greater than 0"
            )
        
        user_id = str(user.get('_id', ''))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"don_{user_id[-8:]}_{int(datetime.utcnow().timestamp()) % 10000}",
            "notes": {
                "purpose": "donation",
                "user_id": user_id,
                "donation_purpose": request.metadata.get("donation_purpose", "general") if request.metadata else "general"
            }
        }
        
        order = client.order.create(data=order_data)
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        try:
            await db.donations.insert_one({
                "user_id": ObjectId(user_id),
                "order_id": order["id"],
                "amount": amount,
                "donation_purpose": request.metadata.get("donation_purpose", "general") if request.metadata else "general",
                "status": "created",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        except Exception as db_error:
            print(f"⚠️ Warning: Could not save donation record: {str(db_error)}")
        
        return CreateOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=settings.RZP_KEY_ID
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating donation order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create donation order"
        )


@router.post("/verify")
async def verify_donation(request: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    """Verify donation payment"""
    try:
        client = get_razorpay_client()
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service not configured"
            )
        
        user_id = str(user.get('_id', ''))
        
        expected_signature = request.razorpay_signature
        data_to_verify = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        
        computed_signature = hmac.new(
            settings.RZP_KEY_SECRET.encode(),
            data_to_verify.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if computed_signature != expected_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        donation = await db.donations.find_one({"order_id": request.razorpay_order_id})
        
        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation record not found"
            )
        
        if str(donation.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to this donation"
            )
        
        await db.donations.update_one(
            {"_id": donation["_id"]},
            {
                "$set": {
                    "status": "completed",
                    "payment_id": request.razorpay_payment_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Donation received successfully. Thank you!",
            "donation_id": str(donation["_id"]),
            "amount": donation["amount"],
            "donation_purpose": donation.get("donation_purpose", "general")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error verifying donation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify donation"
        )


@router.get("/history")
async def get_donation_history(user: dict = Depends(get_current_user)):
    """Get donation history for logged-in user"""
    try:
        user_id = str(user.get('_id', ''))
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection unavailable")
        
        donations = await db.donations.find({
            "user_id": ObjectId(user_id),
            "status": "completed"
        }).sort("created_at", -1).to_list(length=100)
        
        return [{
            "id": str(d["_id"]),
            "amount": d["amount"],
            "donation_purpose": d.get("donation_purpose", "general"),
            "created_at": d["created_at"],
            "status": d["status"]
        } for d in donations]
        
    except Exception as e:
        print(f"❌ Error fetching donation history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch donation history"
        )
