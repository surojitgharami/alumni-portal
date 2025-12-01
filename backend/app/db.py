from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .core.settings import settings
from typing import Optional

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        
        await db.users.create_index("email", unique=True)
        await db.users.create_index("registration_number", unique=True)
        await db.student_master.create_index("registration_number", unique=True)
        await db.payments.create_index("order_id")
        await db.payments.create_index("user_id")
        
        print(f"Connected to MongoDB: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"Warning: MongoDB connection failed: {str(e)}")
        print("Application will run without database until MongoDB is available")
        client = None
        db = None


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db
