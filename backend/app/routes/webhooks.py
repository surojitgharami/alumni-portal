from fastapi import APIRouter, HTTPException, status, Request, Header
from ..crud import update_payment_status, update_membership_status, get_payment_by_order_id
from ..core.settings import settings
import hmac
import hashlib
import json

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    if not secret:
        return False
    
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature")
):
    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing signature header"
        )
    
    body = await request.body()
    
    if not verify_webhook_signature(body, x_razorpay_signature, settings.RZP_WEBHOOK_SECRET):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    try:
        payload = json.loads(body)
        event = payload.get("event")
        
        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            
            if order_id:
                await update_payment_status(order_id, payment_id, "captured", payment_entity)
                
                payment = await get_payment_by_order_id(order_id)
                if payment and payment.get("purpose") == "membership":
                    await update_membership_status(str(payment["user_id"]), "active")
        
        elif event == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            
            if order_id:
                await update_payment_status(order_id, payment_id, "failed", payment_entity)
        
        elif event == "refund.processed":
            refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
            payment_id = refund_entity.get("payment_id")
        
        return {"status": "ok"}
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}"
        )
