from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

def get_appointments(db: Session, skip: int = 0, limit: int = 100, doctor_id: int = None, patient_id: int = None):
    query = db.query(Appointment)
    if doctor_id is not None:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id is not None:
        query = query.filter(Appointment.patient_id == patient_id)
    return query.offset(skip).limit(limit).all()

def get_appointment(db: Session, appointment_id: int):
    return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()

def create_appointment(db: Session, appointment: AppointmentCreate):
    db_appointment = Appointment(**appointment.model_dump())
    db.add(db_appointment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This doctor is already booked at that date and time."
        )
    db.refresh(db_appointment)
    return db_appointment

def update_appointment(db: Session, appointment_id: int, appointment: AppointmentUpdate):
    db_appointment = get_appointment(db, appointment_id)
    if db_appointment:
        for key, value in appointment.model_dump().items():
            setattr(db_appointment, key, value)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="This doctor is already booked at that date and time."
            )
        db.refresh(db_appointment)
    return db_appointment

def delete_appointment(db: Session, appointment_id: int):
    db_appointment = get_appointment(db, appointment_id)
    if db_appointment:
        db_appointment.status = "Cancelled"
        db.commit()
        db.refresh(db_appointment)
    return db_appointment