from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "alumni_portal")
    
    # JWT - Production Grade Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRATION_MINUTES: int = 15  # Short-lived access token
    JWT_REFRESH_EXPIRATION_DAYS: int = 7  # Longer-lived refresh token
    MAX_REFRESH_TOKENS_PER_USER: int = 3  # Max concurrent sessions
    
    # Admin
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@college.edu")
    ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")
    
    # Razorpay
    RZP_KEY_ID: str = os.getenv("RZP_KEY_ID", "")
    RZP_KEY_SECRET: str = os.getenv("RZP_KEY_SECRET", "")
    RZP_WEBHOOK_SECRET: str = os.getenv("RZP_WEBHOOK_SECRET", "")
    
    # URLs
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5000")
    
    # Payments
    MEMBERSHIP_AMOUNT: int = 50000
    
    # Security
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    BCRYPT_ROUNDS: int = 12
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 10
    PASSWORD_HISTORY_COUNT: int = 3
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: list = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_DOCUMENT_TYPES: list = ["pdf"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
