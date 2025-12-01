from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from .db import connect_to_mongo, close_mongo_connection
from .scheduler import start_scheduler, stop_scheduler
from .monitoring import init_sentry, request_count, request_duration
from .security_middleware import setup_security_middleware
from slowapi import Limiter
from slowapi.util import get_remote_address
import time

# Import route modules - with fallback for missing modules
import importlib
import sys

limiter = Limiter(key_func=get_remote_address)


def safe_import(module_name):
    """Safely import route modules, skip if not found"""
    try:
        return importlib.import_module(f".routes.{module_name}", package="app")
    except ImportError:
        print(f"⚠️  Warning: {module_name} module not found")
        return None


# Core routes (should always exist)
core_routes = [
    'auth', 'payments', 'webhooks', 'events', 'jobs', 'admin', 'notifications',
    'alumni', 'applications', 'analytics', 'announcements', 'donations',
    'donations_admin', 'profile', 'faculty', 'content'
]

# Faculty routes (may or may not exist)
faculty_routes = [
    'faculty_admin', 'faculty_dashboard', 'faculty_events', 'faculty_jobs',
    'faculty_announcements', 'faculty_activity', 'faculty_newsletters',
    'faculty_achievements', 'faculty_communication',
    'faculty_analytics_advanced', 'faculty_gallery', 'department_notices',
    'discussion', 'student_events', 'admin_faculty', 'alumni_achievements',
    'payments_reconciliation', 'audit_logs', 'discussion_moderation',
    'analytics_advanced', 'api_aliases'
]

# Import all modules
routes = {}
for route_name in core_routes + faculty_routes:
    module = safe_import(route_name)
    if module:
        routes[route_name] = module


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    init_sentry()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()
    await close_mongo_connection()
    print("✅ Disconnected from MongoDB")


app = FastAPI(
    title="Alumni Portal API",
    description="API for the Alumni Portal",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if os.getenv("ENVIRONMENT") == "production" else "/api/docs",
    redoc_url=None if os.getenv("ENVIRONMENT") == "production" else "/api/redoc")

# Setup security middleware (CORS, headers, etc.)
setup_security_middleware(app)

# Rate limiting
app.state.limiter = limiter


# Request tracking middleware
@app.middleware("http")
async def track_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    request_duration.labels(endpoint=request.url.path).observe(duration)
    request_count.labels(method=request.method,
                         endpoint=request.url.path,
                         status=response.status_code).inc()
    return response


# Include all routers with /api prefix
for route_name, module in routes.items():
    if module and hasattr(module, 'router'):
        app.include_router(module.router, prefix="/api")


@app.get("/api")
async def api_root():
    return {"message": "Alumni Portal API"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}


# Mount static files and serve frontend
static_dir = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")


# Serve frontend SPA (this should be last)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend static files, fallback to index.html for SPA routing"""
    # Ignore API routes
    if full_path.startswith("api/"):
        return {"error": "Not found"}, 404
    
    file_path = os.path.join(static_dir, full_path)
    
    # Serve actual files if they exist
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Not found"}, 404
