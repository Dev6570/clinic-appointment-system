from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate

def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).filter(Patient.is_active == True).offset(skip).limit(limit).all()

def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.patient_id == patient_id).first()

def get_patient_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(Patient).filter(Patient.email == email, Patient.is_active == True).first()

def get_patient_by_phone(db: Session, phone: str):
    if not phone:
        return None
    return db.query(Patient).filter(Patient.phone == phone, Patient.is_active == True).first()

def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient: PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if db_patient:
        for key, value in patient.model_dump().items():
            setattr(db_patient, key, value)
        db.commit()
        db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int):
    db_patient = get_patient(db, patient_id)
    if db_patient:
        db_patient.is_active = False
        db.commit()
        db.refresh(db_patient)
    return db_patient