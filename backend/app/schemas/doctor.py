from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.validators import validate_phone_optional

class DoctorBase(BaseModel):
    doctor_name: str
    specialization: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    experience: Optional[int] = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return validate_phone_optional(v)

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    doctor_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True