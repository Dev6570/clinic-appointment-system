from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.crud import patient as patient_crud
from app.crud import user as user_crud
from app.auth_utils import get_current_user, require_roles
from app.models.user import User
from app.audit import log_event

router = APIRouter(prefix="/api/patients", tags=["Patients"])

# The full patient roster is front-desk business, not something every role
# should be able to browse - only Admin/Receptionist can list all patients.
# A single patient record can be read by staff, or by the patient themself
# (and only their own record). Doctors read individual patients as needed
# for a visit, but don't get the full roster.


@router.get("/", response_model=list[PatientResponse])
def read_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    return patient_crud.get_patients(db, skip=skip, limit=limit)


@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "Patient" and current_user.patient_id != patient_id:
        raise HTTPException(status_code=403, detail="You can only view your own record.")
    db_patient = patient_crud.get_patient(db, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


@router.post("/", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    return patient_crud.create_patient(db, patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    db_patient = patient_crud.update_patient(db, patient_id, patient)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Contact info is supposed to flow FROM the patient record TO any
    # linked login (routers/user.py enforces that direction when the
    # account itself is created/edited). This is the other half of that
    # rule: if the patient record changes here, push it into the linked
    # account too, so the login can't silently drift out of sync with the
    # record it's supposed to represent.
    linked_user = db.query(User).filter(User.patient_id == patient_id).first()
    if linked_user and (linked_user.email != db_patient.email or linked_user.phone != db_patient.phone):
        email_conflict = user_crud.get_user_by_email(db, db_patient.email, exclude_user_id=linked_user.user_id)
        phone_conflict = user_crud.get_user_by_phone(db, db_patient.phone, exclude_user_id=linked_user.user_id)
        if email_conflict or phone_conflict:
            # Don't fail the patient edit over this - it's a rare edge case
            # (the new contact info happens to already belong to some other
            # account) and the receptionist editing a patient record isn't
            # the right person to resolve an account conflict. Leave the
            # login as-is and leave a trail for an Admin to sort out.
            log_event(
                db, action="user_contact_sync_failed", actor_user=current_user, request=request,
                detail=f"patient #{patient_id} contact info changed but linked account '{linked_user.username}' "
                       f"was NOT updated - new email/phone already belongs to another account",
            )
        else:
            linked_user.email = db_patient.email
            linked_user.phone = db_patient.phone
            db.commit()
            log_event(
                db, action="user_contact_synced", actor_user=current_user, request=request,
                detail=f"synced account '{linked_user.username}' contact info from updated patient #{patient_id} record",
            )

    return db_patient


@router.delete("/{patient_id}", response_model=PatientResponse)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    db_patient = patient_crud.delete_patient(db, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient
