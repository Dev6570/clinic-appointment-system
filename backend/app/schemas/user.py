from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

VALID_ROLES = ("Admin", "Receptionist", "Doctor", "Patient")


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        return v

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


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None
    password: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v is not None and v not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("password must include at least one letter and one number")
        return v


class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
