from pydantic import BaseModel
from typing import List

class DailyReport(BaseModel):
    date: str
    total_appointments: int
    scheduled: int
    completed: int
    cancelled: int

class DoctorReportItem(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    total_appointments: int
    completed: int
    cancelled: int

class PatientReportItem(BaseModel):
    patient_id: int
    patient_name: str
    total_appointments: int
    completed: int
    cancelled: int

class DoctorReport(BaseModel):
    report: List[DoctorReportItem]

class PatientReport(BaseModel):
    report: List[PatientReportItem]
    