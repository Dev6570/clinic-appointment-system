from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    """Public self-signup, always creates a Patient-role account. Admin/
    Receptionist/Doctor accounts still have to go through the Admin-only
    Users page (routers/user.py) - self-signup deliberately can't create
    those.

    Validators are duplicated from schemas/user.py's UserCreate on purpose
    (this is a separate public-facing entry point, not the admin one) - keep
    the two in sync if the password/username rules ever change.
    """
    username: str
    password: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("password must include at least one letter and one number")
        return v

    @field_validator("username")
    @classmethod
    def username_min_length(cls, v):
        if len(v.strip()) < 3:
            raise ValueError("username must be at least 3 characters")
        return v.strip()

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None

    class Config:
        from_attributes = True