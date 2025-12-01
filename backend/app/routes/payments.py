from fastapi import APIRouter, HTTPException, status, Depends, Request
from ..models import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from ..crud import create_payment_record, update_payment_status, update_membership_status, get_payment_by_order_id
from ..deps import get_current_user
from ..core.settings import settings
from ..db import get_database
from bson import ObjectId
from datetime import datetime
import razorpay
import hmac
import hashlib

router = APIRouter(prefix="/payments", tags=["Payments"])

def get_razorpay_client():
    if not settings.RZP_KEY_ID or not settings.RZP_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RZP_KEY_ID, settings.RZP_KEY_SECRET))


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(request: CreateOrderRequest, user: dict = Depends(get_current_user)):
    try:
        client = get_razorpay_client()
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service not configured. Please set Razorpay credentials."
            )
        
        if request.purpose == "membership":
            amount = settings.MEMBERSHIP_AMOUNT
        else:
            amount = request.amount
            if amount <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid payment amount"
                )
        
        user_id = str(user.get('_id', ''))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"{request.purpose}_{user_id}",
            "notes": {
                "purpose": request.purpose,
                "user_id": user_id,
                **(request.metadata or {})
            }
        }
        
        order = client.order.create(data=order_data)
        
        try:
            await create_payment_record({
                "user_id": user_id,
                "order_id": order["id"],
                "amount": amount,
                "purpose": request.purpose,
                "status": "created",
                "metadata": request.metadata or {},
                "raw": order
            })
        except Exception as db_error:
            print(f"⚠️ Warning: Could not save payment record to database: {str(db_error)}")
        
        return CreateOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=settings.RZP_KEY_ID
        )
        
    except HTTPException:
        raise
    except razorpay.errors.BadRequestError as e:
        print(f"❌ Razorpay BadRequest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment request: {str(e)}"
        )
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Payment Error: {type(e).__name__}: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {error_msg}"
        )


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    client = get_razorpay_client()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured"
        )
    
    payment_record = await get_payment_by_order_id(request.razorpay_order_id)
    if not payment_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found"
        )
    
    if str(payment_record["user_id"]) != str(user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if payment_record["purpose"] != request.purpose:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment purpose mismatch"
        )
    
    try:
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        
        await update_payment_status(
            order_id=request.razorpay_order_id,
            payment_id=request.razorpay_payment_id,
            status_value="captured",
            raw=params_dict
        )
        
        if request.purpose == "membership":
            if payment_record["amount"] >= settings.MEMBERSHIP_AMOUNT:
                await update_membership_status(str(user["_id"]), "active")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient payment amount for membership"
                )
        elif request.purpose == "donation":
            db = get_database()
            if db is not None:
                try:
                    await db.donations.insert_one({
                        "user_id": ObjectId(str(user["_id"])),
                        "order_id": request.razorpay_order_id,
                        "payment_id": request.razorpay_payment_id,
                        "amount": payment_record["amount"],
                        "donation_purpose": payment_record.get("metadata", {}).get("donation_purpose", "general"),
                        "status": "completed",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                except Exception as db_error:
                    print(f"⚠️ Warning: Could not save donation record: {str(db_error)}")
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "payment_id": request.razorpay_payment_id
        }
        
    except razorpay.errors.SignatureVerificationError as e:
        print(f"❌ Signature verification failed: {str(e)}")
        await update_payment_status(
            order_id=request.razorpay_order_id,
            payment_id=request.razorpay_payment_id,
            status_value="failed"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature."
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Payment verify error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification error: {str(e)}"
        )


@router.get("/status/{order_id}")
async def get_payment_status(order_id: str, user: dict = Depends(get_current_user)):
    payment = await get_payment_by_order_id(order_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if str(payment["user_id"]) != str(user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "order_id": payment["order_id"],
        "status": payment["status"],
        "amount": payment["amount"],
        "purpose": payment["purpose"]
    }
