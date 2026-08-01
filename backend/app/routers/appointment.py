from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.crud import appointment as appointment_crud
from app.auth_utils import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

# Booking stays a front-desk operation (Admin/Receptionist create & fully
# edit). Doctors see only their own appointments and may only update the
# clinical fields (status, remarks) — not the patient, doctor, date, or time.
# Patients see only their own appointments and may only cancel an upcoming
# scheduled one, never edit or create.


def _forbidden(detail: str):
    raise HTTPException(status_code=403, detail=detail)


@router.get("/", response_model=list[AppointmentResponse])
def read_appointments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in ("Admin", "Receptionist"):
        return appointment_crud.get_appointments(db, skip=skip, limit=limit)
    if current_user.role == "Doctor":
        return appointment_crud.get_appointments(db, skip=skip, limit=limit, doctor_id=current_user.doctor_id)
    if current_user.role == "Patient":
        return appointment_crud.get_appointments(db, skip=skip, limit=limit, patient_id=current_user.patient_id)
    return []


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_appointment = appointment_crud.get_appointment(db, appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.role == "Doctor" and db_appointment.doctor_id != current_user.doctor_id:
        _forbidden("You can only view your own appointments.")
    if current_user.role == "Patient" and db_appointment.patient_id != current_user.patient_id:
        _forbidden("You can only view your own appointments.")
    return db_appointment


@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    return appointment_crud.create_appointment(db, appointment)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = appointment_crud.get_appointment(db, appointment_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "Doctor":
        if existing.doctor_id != current_user.doctor_id:
            _forbidden("You can only update your own appointments.")
        # Doctors may only touch the clinical fields — not reassign the
        # visit or change when/who it's with.
        unauthorized_changes = (
            appointment.doctor_id != existing.doctor_id
            or appointment.patient_id != existing.patient_id
            or str(appointment.appointment_date) != str(existing.appointment_date)
            or str(appointment.appointment_time) != str(existing.appointment_time)
        )
        if unauthorized_changes:
            _forbidden("Doctors can update status and visit notes only, not the visit details.")
    elif current_user.role not in ("Admin", "Receptionist"):
        _forbidden("You don't have permission to update appointments.")

    db_appointment = appointment_crud.update_appointment(db, appointment_id, appointment)
    return db_appointment


@router.delete("/{appointment_id}", response_model=AppointmentResponse)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = appointment_crud.get_appointment(db, appointment_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "Patient":
        if existing.patient_id != current_user.patient_id:
            _forbidden("You can only cancel your own appointments.")
        if existing.status != "Scheduled":
            raise HTTPException(status_code=400, detail="Only upcoming scheduled appointments can be cancelled.")
    elif current_user.role not in ("Admin", "Receptionist"):
        _forbidden("You don't have permission to cancel appointments.")

    db_appointment = appointment_crud.delete_appointment(db, appointment_id)
    return db_appointment
