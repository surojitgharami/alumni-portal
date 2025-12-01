from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime, date
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


class VerifyRegistrationRequest(BaseModel):
    registration_number: str
    department: str
    passout_year: int


class VerifyRegistrationResponse(BaseModel):
    valid: bool
    reason: Optional[str] = None
    student_record: Optional[dict] = None


class SignupRequest(BaseModel):
    name: str
    dob: date
    department: str
    phone: str
    email: EmailStr
    registration_number: str
    passout_year: int
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    dob: Optional[date] = None
    department: str
    phone: Optional[str] = None
    email: str
    registration_number: Optional[str] = None
    passout_year: Optional[int] = None
    role: Literal["student", "alumni", "admin", "faculty"]
    membership_status: Optional[Literal["unpaid", "active"]] = None
    joined_at: datetime
    upgraded_to_alumni_at: Optional[datetime] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    dob: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    workplace: Optional[str] = None
    designation: Optional[str] = None
    industry: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_photo_url: Optional[str] = None


class ProfessionalProfile(BaseModel):
    workplace: Optional[str] = None
    designation: Optional[str] = None
    industry: Optional[str] = None
    skills: List[str] = []


class Achievement(BaseModel):
    title: str
    description: Optional[str] = None
    certification_url: Optional[str] = None
    date: Optional[datetime] = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    dob: Optional[date] = None
    email: str
    phone: Optional[str] = None
    registration_number: Optional[str] = None
    passout_year: Optional[int] = None
    department: Optional[str] = None
    role: Optional[str] = None
    membership_status: Optional[str] = None
    profile_photo_url: Optional[str] = None
    resume_url: Optional[str] = None
    guardian_name: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    employment_status: Optional[str] = None
    employer_name: Optional[str] = None
    highest_qualification: Optional[str] = None
    address: Optional[str] = None
    social_media: Optional[dict] = None
    professional: Optional[dict] = None
    achievements: Optional[List[dict]] = None
    joined_at: Optional[datetime] = None
    profile_photo_url: Optional[str] = None
    professional: Optional[dict] = None
    achievements: List[dict] = []
    joined_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CreateOrderRequest(BaseModel):
    amount: int
    purpose: Literal["membership", "event", "donation"]
    metadata: Optional[dict] = None


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    purpose: Literal["membership", "event", "donation"]
    metadata: Optional[dict] = None


class EventCreate(BaseModel):
    title: str
    department: str = "All"
    description: str
    event_date: datetime
    location: str
    event_type: Literal["Online", "Offline"] = "Offline"
    is_paid: bool = False
    fee_amount: int = 0
    image: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    title: str
    department: str
    description: str
    event_date: datetime
    location: str
    event_type: str = "Offline"
    is_paid: bool
    fee_amount: int
    created_by: str
    approved: bool
    attendees_count: int
    created_at: datetime
    image: Optional[str] = None


class EventRegistration(BaseModel):
    event_id: str


class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    location: str
    job_type: Literal["full-time", "part-time", "contract", "internship"] = "full-time"
    salary_range: Optional[str] = None
    application_link: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    description: str
    location: str
    job_type: str
    salary_range: Optional[str]
    application_link: Optional[str]
    created_by: str
    created_by_name: Optional[str] = None
    approved: bool
    created_at: datetime


class AttendeeInfo(BaseModel):
    user_id: str
    ticket_id: str
    payment_status: Literal["pending", "paid", "free"]
    registered_at: datetime


# New Models for missing features

class JobApplication(BaseModel):
    job_id: str
    user_id: str
    user_name: str
    user_email: str
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    status: Literal["applied", "shortlisted", "rejected", "selected"] = "applied"
    applied_at: datetime


class JobApplicationResponse(BaseModel):
    id: str
    job_id: str
    user_id: str
    user_name: str
    user_email: str
    resume_url: Optional[str]
    cover_letter: Optional[str]
    status: str
    applied_at: datetime


class Notification(BaseModel):
    user_id: str
    title: str
    message: str
    notification_type: Literal["payment", "event", "job", "admin", "system"]
    related_id: Optional[str] = None
    read: bool = False
    created_at: datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    read: bool
    created_at: datetime


class AlumniProfile(BaseModel):
    user_id: str
    name: str
    email: str
    department: str
    passout_year: int
    phone: str
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    linkedin_url: Optional[str] = None


class AlumniDirectoryResponse(BaseModel):
    id: str
    name: str
    department: str
    passout_year: int
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    email: str
    profile_photo_url: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None
    professional: Optional[dict] = None


class AnalyticsMetrics(BaseModel):
    total_alumni: int
    active_members: int
    total_events: int
    total_jobs_posted: int
    total_revenue: float
    daily_active_users: int
    alumni_by_year: dict
    events_by_month: dict
    jobs_by_department: dict


class AdminBroadcast(BaseModel):
    subject: str
    message: str
    recipient_filter: Optional[Literal["all", "alumni", "students"]] = "all"
