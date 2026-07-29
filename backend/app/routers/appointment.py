from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.crud import appointment as appointment_crud
from app.auth_utils import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.get("/", response_model=list[AppointmentResponse])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return appointment_crud.get_appointments(db, skip=skip, limit=limit)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_appointment = appointment_crud.get_appointment(db, appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment

@router.post("/", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return appointment_crud.create_appointment(db, appointment)

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, appointment: AppointmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_appointment = appointment_crud.update_appointment(db, appointment_id, appointment)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment

@router.delete("/{appointment_id}", response_model=AppointmentResponse)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_appointment = appointment_crud.delete_appointment(db, appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment