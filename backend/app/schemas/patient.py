from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.validators import validate_phone_optional

class PatientBase(BaseModel):
    patient_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return validate_phone_optional(v)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientResponse(PatientBase):
    patient_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True