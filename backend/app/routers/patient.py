from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.crud import patient as patient_crud
from app.auth_utils import get_current_user, require_roles
from app.models.user import User

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Receptionist")),
):
    db_patient = patient_crud.update_patient(db, patient_id, patient)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
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
