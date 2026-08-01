from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse
from app.crud import doctor as doctor_crud
from app.auth_utils import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

# Everyone signed in can read the doctor list/detail (names show up all over
# the app — on appointments, reports, the patient portal). Only Admin can
# create, edit, or remove a doctor record.


@router.get("/", response_model=list[DoctorResponse])
def read_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return doctor_crud.get_doctors(db, skip=skip, limit=limit)


@router.get("/{doctor_id}", response_model=DoctorResponse)
def read_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_doctor = doctor_crud.get_doctor(db, doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor


@router.post("/", response_model=DoctorResponse)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin"))):
    return doctor_crud.create_doctor(db, doctor)


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, doctor: DoctorUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin"))):
    db_doctor = doctor_crud.update_doctor(db, doctor_id, doctor)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor


@router.delete("/{doctor_id}", response_model=DoctorResponse)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin"))):
    db_doctor = doctor_crud.delete_doctor(db, doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor
