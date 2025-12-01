# Alumni Portal

A comprehensive alumni portal with separate frontend and backend, featuring student verification, membership payments, job postings, and event management.

## Features

- **Student Verification**: Registration number verification against university records
- **Role-Based Access**: Students (4th year), Alumni, and Admin roles
- **Membership Payments**: Razorpay integration for membership and event payments
- **Job Board**: Alumni can post jobs (with admin approval)
- **Events**: Create and register for events with QR ticket generation
- **Admin Dashboard**: Approve jobs/events, view statistics, manage users

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- FastAPI (Python)
- MongoDB (Motor async driver)
- JWT Authentication
- Razorpay SDK
- QR Code generation

## Environment Variables

Set these in Replit Secrets:

```bash
# Database
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-secret-key

# Admin Credentials
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD_HASH=$2b$12$...  # bcrypt hash

# Razorpay
RZP_KEY_ID=rzp_test_...
RZP_KEY_SECRET=...
RZP_WEBHOOK_SECRET=...

# URLs
BACKEND_URL=https://your-repl.replit.app
VITE_BACKEND_URL=https://your-repl.replit.app
VITE_RZP_KEY_ID=rzp_test_...
```

### Generate Admin Password Hash

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("your-admin-password"))
```

## Running the Project

The project runs both frontend and backend simultaneously using the configured workflow.

### Seed Database

To populate sample student data for testing:

```bash
cd backend && python scripts/seed_student_master.py
```

### Sample Registration Numbers for Testing

After running the seed script, use these for signup:
- REG202601001 - CSE - 2026
- REG202501001 - CSE - 2025
- REG202401001 - CSE - 2024

## API Endpoints

### Authentication
- `POST /api/auth/verify-registration` - Verify student registration
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/webhooks/razorpay` - Payment webhooks

### Events
- `GET /api/events` - List approved events
- `POST /api/events` - Create event (alumni/admin)
- `POST /api/events/:id/register` - Register for event

### Jobs
- `GET /api/jobs` - List approved jobs
- `POST /api/jobs` - Create job (alumni with membership)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats
- `PATCH /api/admin/events/:id/approve` - Approve event
- `PATCH /api/admin/jobs/:id/approve` - Approve job
- `POST /api/admin/cron/upgrade-students` - Upgrade students to alumni

## Business Rules

1. Only 4th year students (passout_year = current_year + 1) or alumni can register
2. Registration number and passout year are immutable after signup
3. Membership payment required for:
   - Posting jobs
   - Joining paid events
   - Receiving email invitations
4. Students auto-upgrade to alumni after passout year
5. All jobs and events require admin approval
