"""Security middleware: headers, CORS, request validation"""
from fastapi import Request, Response
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .core.settings import settings
import json


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # CSP - restrict resource loading
        csp = (
            "default-src 'self'; "
            "img-src 'self' https: data:; "
            "script-src 'self' https://checkout.razorpay.com; "
            f"connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com {settings.BACKEND_URL} {settings.FRONTEND_URL}; "
            "style-src 'self' 'unsafe-inline'; "
            "font-src 'self'; "
            "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; "
            "frame-ancestors 'none';")
        response.headers["Content-Security-Policy"] = csp

        # HTTPS enforcement
        if settings.ENVIRONMENT == "production":
            response.headers[
                "Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validate request sizes and content"""

    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 1024 * 1024:  # 1MB
            return Response(json.dumps({"error": "Request payload too large"}),
                            status_code=413)
        return await call_next(request)


def get_cors_config():
    """Get CORS configuration based on environment"""
    if settings.ENVIRONMENT == "production":
        # Production: restrict to frontend domain only
        allowed_origins = [settings.FRONTEND_URL, "https://alumni-portal-one-alpha.vercel.app"]
    else:
        # Development: allow all origins and localhost variants
        allowed_origins = ["*"]

    return {
        "allow_origins": allowed_origins,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["*"],
        "max_age": 600,
    }


def setup_security_middleware(app):
    """Setup all security middleware"""
    # CRITICAL: Add CORS FIRST (it's added to front, so executes LAST in chain)
    # This ensures CORS headers are set for all responses
    cors_config = get_cors_config()
    app.add_middleware(CORSMiddleware, **cors_config)

    # Add request validation (runs after CORS in chain)
    app.add_middleware(RequestValidationMiddleware)

    # Add security headers (runs first in chain, after CORS already set headers)
    app.add_middleware(SecurityHeadersMiddleware)
