from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.report import DailyReport, DoctorReport, PatientReport
from app.auth_utils import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/daily", response_model=DailyReport)
def daily_report(
    report_date: date = Query(default=None, description="Defaults to today if not provided"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = report_date or date.today()
    query = db.query(Appointment).filter(Appointment.appointment_date == target_date)

    return {
        "date": str(target_date),
        "total_appointments": query.count(),
        "scheduled": query.filter(Appointment.status == "Scheduled").count(),
        "completed": query.filter(Appointment.status == "Completed").count(),
        "cancelled": query.filter(Appointment.status == "Cancelled").count(),
    }

@router.get("/doctors", response_model=DoctorReport)
def doctor_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
    result = []
    for doc in doctors:
        appts = db.query(Appointment).filter(Appointment.doctor_id == doc.doctor_id)
        result.append({
            "doctor_id": doc.doctor_id,
            "doctor_name": doc.doctor_name,
            "specialization": doc.specialization,
            "total_appointments": appts.count(),
            "completed": appts.filter(Appointment.status == "Completed").count(),
            "cancelled": appts.filter(Appointment.status == "Cancelled").count(),
        })
    return {"report": result}

@router.get("/patients", response_model=PatientReport)
def patient_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patients = db.query(Patient).filter(Patient.is_active == True).all()
    result = []
    for pat in patients:
        appts = db.query(Appointment).filter(Appointment.patient_id == pat.patient_id)
        result.append({
            "patient_id": pat.patient_id,
            "patient_name": pat.patient_name,
            "total_appointments": appts.count(),
            "completed": appts.filter(Appointment.status == "Completed").count(),
            "cancelled": appts.filter(Appointment.status == "Cancelled").count(),
        })
    return {"report": result}
