"""Rate limiting for authentication endpoints"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
LOGIN_LIMIT = "5/minute"
SIGNUP_LIMIT = "3/minute"
PASSWORD_RESET_LIMIT = "3/minute"
GENERAL_LIMIT = "30/minute"

def create_rate_limit_error_handler(app):
    """Create custom rate limit error handler"""
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return {
            "detail": "Too many requests. Please try again later.",
            "retry_after": exc.detail
        }
