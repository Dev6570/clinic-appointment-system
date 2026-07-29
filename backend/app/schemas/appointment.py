from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None
    status: Optional[str] = "Scheduled"
    remarks: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    appointment_id: int
    created_at: datetime

    class Config:
        from_attributes = True