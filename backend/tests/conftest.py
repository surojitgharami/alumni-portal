"""Test configuration"""
import pytest
from datetime import datetime

@pytest.fixture
def sample_user():
    return {
        "_id": "test_user_123",
        "name": "Test User",
        "email": "test@example.com",
        "role": "student",
        "department": "CSE",
        "passout_year": 2024,
        "registration_number": "REG123"
    }

@pytest.fixture
def sample_payment():
    return {
        "_id": "payment_123",
        "user_id": "test_user_123",
        "order_id": "order_123",
        "amount": 500,
        "status": "verified",
        "created_at": datetime.utcnow()
    }

@pytest.fixture
def sample_event():
    return {
        "_id": "event_123",
        "title": "Tech Talk",
        "description": "A talk on AI",
        "date": datetime.utcnow(),
        "department": "CSE",
        "created_by": "faculty_123",
        "registration_count": 10
    }
