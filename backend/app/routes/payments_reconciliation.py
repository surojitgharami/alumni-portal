"""Payment reconciliation and webhook retry handler"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from ..db import get_database
from ..deps import get_current_user

router = APIRouter(prefix="/admin/payments", tags=["payment-reconciliation"])

@router.get("/reconcile")
async def reconcile_payments(current_user: dict = Depends(get_current_user)):
    """Reconcile payment records with webhooks"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get failed webhooks
        failed_webhooks = await db.webhook_logs.find({
            "status": "failed"
        }).to_list(None)
        
        # Get pending verifications
        pending = await db.payments.find({
            "status": "created",
            "created_at": {"$lt": datetime.utcnow() - timedelta(hours=1)}
        }).to_list(None)
        
        # Get mismatched records
        mismatched = await db.payment_logs.find({
            "status": "mismatch"
        }).to_list(None)
        
        # Retry failed webhooks
        retried_count = 0
        for webhook in failed_webhooks[:5]:  # Retry up to 5 at a time
            try:
                retry_count = webhook.get("retry_count", 0)
                if retry_count < 3:
                    await db.webhook_logs.update_one(
                        {"_id": webhook["_id"]},
                        {
                            "$set": {
                                "status": "retrying",
                                "retry_count": retry_count + 1,
                                "last_retry": datetime.utcnow()
                            }
                        }
                    )
                    retried_count += 1
            except Exception as e:
                print(f"⚠️ Error retrying webhook: {str(e)}")
        
        return {
            "failed_webhooks_count": len(failed_webhooks),
            "pending_verifications_count": len(pending),
            "mismatched_records_count": len(mismatched),
            "retried_webhooks_count": retried_count,
            "status": "reconciliation_complete"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reconciliation error: {str(e)}")

@router.post("/webhook-retry/{webhook_id}")
async def retry_webhook(webhook_id: str, current_user: dict = Depends(get_current_user)):
    """Manually retry a failed webhook"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        from bson import ObjectId
        webhook = await db.webhook_logs.find_one({"_id": ObjectId(webhook_id)})
        
        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        await db.webhook_logs.update_one(
            {"_id": ObjectId(webhook_id)},
            {
                "$set": {
                    "status": "retrying",
                    "retry_count": webhook.get("retry_count", 0) + 1,
                    "last_retry": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Webhook queued for retry"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrying webhook: {str(e)}")

@router.get("/dashboard")
async def payment_dashboard(current_user: dict = Depends(get_current_user)):
    """Get payment reconciliation dashboard"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        total_payments = await db.payments.count_documents({})
        successful = await db.payments.count_documents({"status": "verified"})
        failed = await db.payments.count_documents({"status": "failed"})
        pending = await db.payments.count_documents({"status": "created"})
        
        total_amount = 0
        successful_payments = await db.payments.find({"status": "verified"}).to_list(None)
        for p in successful_payments:
            total_amount += p.get("amount", 0)
        
        return {
            "total_payments": total_payments,
            "successful": successful,
            "failed": failed,
            "pending": pending,
            "total_amount_collected": total_amount,
            "success_rate": f"{(successful/max(total_payments, 1)*100):.1f}%"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")
