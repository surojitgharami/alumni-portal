from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime
from pydantic import BaseModel
from ..models import (
    VerifyRegistrationRequest, VerifyRegistrationResponse,
    SignupRequest, LoginRequest, TokenResponse, UserResponse,
    UserUpdateRequest
)
from ..crud import (
    get_student_master_record, check_user_exists, create_user,
    get_user_by_email, update_user
)
from ..core.security import verify_password, create_access_token
from ..deps import get_current_user
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


def user_to_response(user: dict) -> UserResponse:
    from datetime import date
    # Handle optional fields for different user types (faculty vs alumni/student)
    dob_value = user.get("dob")
    if dob_value:
        dob_value = dob_value.date() if isinstance(dob_value, datetime) else dob_value
    else:
        dob_value = date.today()
    
    # Faculty users don't have membership status
    is_faculty = user.get("role") == "faculty"
    membership = None if is_faculty else user.get("membership_status", "unpaid")
    
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        dob=dob_value,
        department=user.get("department", ""),
        phone=user.get("phone", ""),
        email=user["email"],
        registration_number=user.get("registration_number", ""),
        passout_year=user.get("passout_year", 0),
        role=user["role"],
        membership_status=membership,
        joined_at=user.get("joined_at", datetime.utcnow()),
        upgraded_to_alumni_at=user.get("upgraded_to_alumni_at")
    )


@router.post("/verify-registration", response_model=VerifyRegistrationResponse)
async def verify_registration(request: VerifyRegistrationRequest):
    current_year = datetime.now().year
    
    if request.passout_year > current_year + 1:
        return VerifyRegistrationResponse(
            valid=False,
            reason="Only 4th year students (final year) or alumni can register"
        )
    
    # Check student_master for registrations
    record = await get_student_master_record(
        request.registration_number,
        request.department,
        request.passout_year
    )
    
    if not record:
        return VerifyRegistrationResponse(
            valid=False,
            reason="Registration number not found or details do not match university records"
        )
    
    user_exists = await check_user_exists(registration_number=request.registration_number)
    if user_exists:
        return VerifyRegistrationResponse(
            valid=False,
            reason="An account with this registration number already exists"
        )
    
    return VerifyRegistrationResponse(
        valid=True,
        student_record={
            "name": record.get("name"),
            "department": record.get("department"),
            "passout_year": record.get("passout_year")
        }
    )


@router.post("/signup", response_model=TokenResponse)
@limiter.limit("3/minute")
async def signup(request: SignupRequest, req: Request):
    current_year = datetime.now().year
    
    if request.passout_year > current_year + 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 4th year students (final year) or alumni can register"
        )
    
    record = await get_student_master_record(
        request.registration_number,
        request.department,
        request.passout_year
    )
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration verification failed. Please verify your details."
        )
    
    if await check_user_exists(email=request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    if await check_user_exists(registration_number=request.registration_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this registration number already exists"
        )
    
    user = await create_user(request.model_dump())
    
    # Send welcome email
    from ..services.email_service import send_email
    welcome_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to Alumni Portal! 🎓</h2>
            <p>Hi {user['name']},</p>
            <p>Your account has been successfully created!</p>
            <p>You can now:</p>
            <ul>
                <li>View the alumni directory</li>
                <li>Connect with fellow alumni</li>
                <li>Explore opportunities and events</li>
            </ul>
            <p>Best regards,<br>Alumni Portal Team</p>
        </body>
    </html>
    """
    await send_email(user["email"], "Welcome to Alumni Portal 🎓", welcome_html)
    
    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    return TokenResponse(
        access_token=token,
        user=user_to_response(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    from ..core.settings import settings
    
    # Check if this is admin login
    if request.email == settings.ADMIN_EMAIL:
        if not settings.ADMIN_PASSWORD_HASH:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Admin account not configured"
            )
        
        if not verify_password(request.password, settings.ADMIN_PASSWORD_HASH):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        token = create_access_token(data={"sub": "admin", "role": "admin", "email": request.email, "_id": "admin"})
        
        from datetime import date
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id="admin",
                name="Administrator",
                email=settings.ADMIN_EMAIL,
                role="admin",
                phone="",
                department="",
                dob=date.today(),
                registration_number="",
                passout_year=0,
                membership_status="active",
                joined_at=datetime.now()
            )
        )
    
    # Regular user/alumni login
    user = await get_user_by_email(request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    return TokenResponse(
        access_token=token,
        user=user_to_response(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    return user_to_response(user)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    user: dict = Depends(get_current_user)
):
    """Change user password"""
    if not verify_password(request.old_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    from ..core.security import get_password_hash as hash_pwd
    new_hash = hash_pwd(request.new_password)
    updated = await update_user(str(user["_id"]), {"password_hash": new_hash})
    
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    return {"message": "Password changed successfully"}


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    request: UserUpdateRequest,
    user: dict = Depends(get_current_user)
):
    update_data = request.model_dump(exclude_unset=True)
    
    forbidden_fields = ["registration_number", "passout_year", "email", "name"]
    for field in forbidden_fields:
        if field in update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field} cannot be modified. Contact admin to report errors."
            )
    
    updated_user = await update_user(str(user["_id"]), update_data)
    
    if not updated_user:
        return user_to_response(user)
    
    return user_to_response(updated_user)


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout user - invalidates JWT by blacklisting"""
    from ..db import get_database
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        # Add token to blacklist (can be verified on protected endpoints)
        await db.token_blacklist.insert_one({
            "user_id": str(user["_id"]),
            "created_at": datetime.utcnow()
        })
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")
