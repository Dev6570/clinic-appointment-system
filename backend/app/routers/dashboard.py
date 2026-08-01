from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.schemas.dashboard import DashboardSummary, TodayStats
from app.auth_utils import require_roles
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin", "Receptionist"))):
    total_doctors = db.query(Doctor).filter(Doctor.is_active == True).count()
    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    total_appointments = db.query(Appointment).count()
    scheduled = db.query(Appointment).filter(Appointment.status == "Scheduled").count()
    completed = db.query(Appointment).filter(Appointment.status == "Completed").count()
    cancelled = db.query(Appointment).filter(Appointment.status == "Cancelled").count()

    return {
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "scheduled_appointments": scheduled,
        "completed_appointments": completed,
        "cancelled_appointments": cancelled,
    }

@router.get("/today", response_model=TodayStats)
def dashboard_today(db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin", "Receptionist"))):
    today = date.today()
    today_query = db.query(Appointment).filter(Appointment.appointment_date == today)

    appointments_today = today_query.count()
    scheduled_today = today_query.filter(Appointment.status == "Scheduled").count()
    completed_today = today_query.filter(Appointment.status == "Completed").count()
    cancelled_today = today_query.filter(Appointment.status == "Cancelled").count()

    return {
        "date": str(today),
        "appointments_today": appointments_today,
        "scheduled_today": scheduled_today,
        "completed_today": completed_today,
        "cancelled_today": cancelled_today,
    }