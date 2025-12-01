"""Background scheduler for automatic student to alumni upgrade"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from .db import get_database
from .services.email_service import send_email

scheduler = AsyncIOScheduler()

async def student_to_alumni_upgrade():
    """Run daily at midnight to upgrade 4th year students to alumni"""
    db = get_database()
    if db is None:
        print("⚠️ Database unavailable for student upgrade")
        return
    
    current_year = datetime.now().year
    
    try:
        # Find students with passout year <= current year
        students_to_upgrade = await db.users.find({
            "role": "student",
            "passout_year": {"$lte": current_year},
            "upgraded_to_alumni_at": {"$exists": False}
        }).to_list(None)
        
        upgraded_count = 0
        for student in students_to_upgrade:
            try:
                # Update student to alumni
                await db.users.update_one(
                    {"_id": student["_id"]},
                    {
                        "$set": {
                            "role": "alumni",
                            "upgraded_to_alumni_at": datetime.utcnow()
                        }
                    }
                )
                
                # Log the upgrade
                await db.upgrade_logs.insert_one({
                    "user_id": str(student["_id"]),
                    "user_name": student.get("name"),
                    "email": student.get("email"),
                    "passout_year": student.get("passout_year"),
                    "upgraded_at": datetime.utcnow()
                })
                
                # Send notification email
                try:
                    await send_email(
                        to_email=student.get("email"),
                        subject="Welcome to Alumni Network",
                        html_body=f"""
                        <p>Congratulations {student.get('name')}!</p>
                        <p>You have been automatically upgraded to Alumni status.</p>
                        <p>Access exclusive alumni features, jobs, and events.</p>
                        """,
                        text_body=f"You have been upgraded to Alumni. Login to explore alumni features."
                    )
                except Exception as e:
                    print(f"⚠️ Email failed for {student.get('email')}: {str(e)}")
                
                # In-app notification
                await db.notifications.insert_one({
                    "user_id": str(student["_id"]),
                    "title": "Alumni Status",
                    "message": "You've been upgraded to Alumni!",
                    "created_at": datetime.utcnow(),
                    "read": False
                })
                
                upgraded_count += 1
            except Exception as e:
                print(f"⚠️ Error upgrading student {student.get('email')}: {str(e)}")
        
        print(f"✅ Upgraded {upgraded_count} students to alumni")
        
    except Exception as e:
        print(f"❌ Error in student upgrade job: {str(e)}")

def start_scheduler():
    """Start background scheduler"""
    if not scheduler.running:
        # Run daily at midnight
        scheduler.add_job(
            student_to_alumni_upgrade,
            CronTrigger(hour=0, minute=0),
            id='student_to_alumni_upgrade',
            name='Daily student to alumni upgrade',
            replace_existing=True
        )
        scheduler.start()
        print("✅ Background scheduler started")

def stop_scheduler():
    """Stop background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("✅ Background scheduler stopped")
