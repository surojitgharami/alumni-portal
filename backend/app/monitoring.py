"""Monitoring: Sentry and Prometheus"""
import os
from prometheus_client import Counter, Histogram, Gauge
import time

# Prometheus metrics
request_count = Counter('alumni_portal_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('alumni_portal_request_duration_seconds', 'Request duration', ['endpoint'])
active_users = Gauge('alumni_portal_active_users', 'Active users')
payment_total = Counter('alumni_portal_payments_total', 'Total payments', ['status'])
event_registrations = Counter('alumni_portal_event_registrations', 'Event registrations')

def init_sentry():
    """Initialize Sentry error tracking"""
    try:
        import sentry_sdk
        sentry_dsn = os.getenv("SENTRY_DSN")
        if sentry_dsn:
            sentry_sdk.init(
                dsn=sentry_dsn,
                traces_sample_rate=0.1,
                environment=os.getenv("ENVIRONMENT", "development")
            )
            print("✅ Sentry initialized")
        else:
            print("⚠️ SENTRY_DSN not set - error tracking disabled")
    except Exception as e:
        print(f"⚠️ Could not initialize Sentry: {str(e)}")

def track_request(method: str, endpoint: str, status_code: int):
    """Track HTTP request metrics"""
    request_count.labels(method=method, endpoint=endpoint, status=status_code).inc()

def track_request_duration(endpoint: str, duration: float):
    """Track request duration"""
    request_duration.labels(endpoint=endpoint).observe(duration)

def track_payment(status: str):
    """Track payment"""
    payment_total.labels(status=status).inc()

def set_active_users(count: int):
    """Set active users gauge"""
    active_users.set(count)

def track_event_registration():
    """Track event registration"""
    event_registrations.inc()
