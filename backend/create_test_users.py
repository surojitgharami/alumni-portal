#!/usr/bin/env python3
"""Quick script to create test users for login testing"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import get_password_hash
from bson import ObjectId
from datetime import datetime, date

async def create_test_users():
    """Create test admin, alumni, and faculty users"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient("mongodb+srv://alumniportal:2006@cluster0.fmvyp.mongodb.net/?retryWrites=true&w=majority")
        db = client.alumni
        
        # Test credentials
        test_users = [
            {
                "email": "admin@alumni.com",
                "password": "admin123",
                "name": "Admin User",
                "role": "admin",
                "department": "Admin",
            },
            {
                "email": "faculty@alumni.com",
                "password": "faculty123",
                "name": "Dr. Faculty",
                "role": "faculty",
                "department": "Computer Science",
            },
            {
                "email": "alumni@alumni.com",
                "password": "alumni123",
                "name": "John Alumni",
                "role": "alumni",
                "department": "Computer Science",
                "registration_number": "REG001",
                "passout_year": 2020,
                "membership_status": "active"
            }
        ]
        
        print("Creating test users...")
        for user_data in test_users:
            email = user_data["email"]
            
            # Check if user exists
            existing = await db.users.find_one({"email": email})
            if existing:
                print(f"⚠️  {email} already exists")
                continue
            
            # Create user
            password_hash = get_password_hash(user_data["password"])
            user_doc = {
                "email": email,
                "password_hash": password_hash,
                "name": user_data["name"],
                "role": user_data["role"],
                "department": user_data.get("department", ""),
                "registration_number": user_data.get("registration_number", ""),
                "passout_year": user_data.get("passout_year", 0),
                "membership_status": user_data.get("membership_status", "unpaid"),
                "phone": "",
                "dob": datetime(1999, 1, 1),
                "profile_photo": None,
                "joined_at": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(user_doc)
            print(f"✅ Created {email} (ID: {result.inserted_id})")
            print(f"   Password: {user_data['password']}")
        
        client.close()
        print("\n✅ Test users created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_test_users())
