from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse
from app.crud import doctor as doctor_crud
from app.crud import user as user_crud
from app.auth_utils import get_current_user, require_roles
from app.models.user import User
from app.audit import log_event

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

# Everyone signed in can read the doctor list/detail (names show up all over
# the app - on appointments, reports, the patient portal). Only Admin can
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
def update_doctor(
    doctor_id: int,
    doctor: DoctorUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    db_doctor = doctor_crud.update_doctor(db, doctor_id, doctor)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Same fix as routers/patient.py: push contact info changes from the
    # doctor record into any linked login, so it can't silently drift out
    # of sync.
    linked_user = db.query(User).filter(User.doctor_id == doctor_id).first()
    if linked_user and (linked_user.email != db_doctor.email or linked_user.phone != db_doctor.phone):
        email_conflict = user_crud.get_user_by_email(db, db_doctor.email, exclude_user_id=linked_user.user_id)
        phone_conflict = user_crud.get_user_by_phone(db, db_doctor.phone, exclude_user_id=linked_user.user_id)
        if email_conflict or phone_conflict:
            log_event(
                db, action="user_contact_sync_failed", actor_user=current_user, request=request,
                detail=f"doctor #{doctor_id} contact info changed but linked account '{linked_user.username}' "
                       f"was NOT updated - new email/phone already belongs to another account",
            )
        else:
            linked_user.email = db_doctor.email
            linked_user.phone = db_doctor.phone
            db.commit()
            log_event(
                db, action="user_contact_synced", actor_user=current_user, request=request,
                detail=f"synced account '{linked_user.username}' contact info from updated doctor #{doctor_id} record",
            )

    return db_doctor


@router.delete("/{doctor_id}", response_model=DoctorResponse)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Admin"))):
    db_doctor = doctor_crud.delete_doctor(db, doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor
