#!/usr/bin/env python3
"""Fix admin password hash in MongoDB"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

async def fix_password():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ MONGO_URI not set. Check your Replit secrets.")
        return
    
    client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client[os.getenv("DATABASE_NAME", "alumni_portal")]
    
    try:
        # Create new password hash using bcrypt
        new_hash = pwd_context.hash("admin123")
        print(f"✅ Generated bcrypt hash for 'admin123'")
        
        # Update admin user in database
        result = await db.users.update_one(
            {"email": "admin@alumni.com"},
            {"$set": {"password_hash": new_hash}}
        )
        
        if result.matched_count > 0:
            print(f"✅ Admin password UPDATED in database")
            print(f"\n📝 Login with:")
            print(f"   Email: admin@alumni.com")
            print(f"   Password: admin123")
        else:
            print("⚠️  Admin user not found in database")
            print("   Creating new admin user...")
            
            await db.users.insert_one({
                "email": "admin@alumni.com",
                "password_hash": new_hash,
                "name": "Administrator",
                "role": "admin",
                "department": "Administration",
                "phone": "9999999999",
                "registration_number": "ADMIN001",
                "passout_year": 2020,
                "dob": "1990-01-01",
                "membership_status": "active"
            })
            print(f"✅ New admin user created")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_password())
