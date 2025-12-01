import pytest
from httpx import AsyncClient
from app.main import app


@pytest.fixture
def test_registration():
    return {
        "registration_number": "REG202601001",
        "department": "CSE",
        "passout_year": 2026
    }


@pytest.mark.asyncio
async def test_verify_registration_valid():
    pass


@pytest.mark.asyncio
async def test_verify_registration_invalid():
    pass


@pytest.mark.asyncio
async def test_signup_flow():
    pass


@pytest.mark.asyncio
async def test_login_flow():
    pass
