from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class DoctorBase(BaseModel):
    doctor_name: str
    specialization: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    experience: Optional[int] = None

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