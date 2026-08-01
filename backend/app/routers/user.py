from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.crud import user as user_crud
from app.auth_utils import require_roles
from app.models.user import User

# Every endpoint here is restricted to Admin — this is account management,
# not clinic data, and should have the smallest possible set of hands on it.
router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=list[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return user_crud.get_users(db, skip=skip, limit=limit)


@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=409, detail="That username is already taken.")
    if user.role == "Doctor" and not user.doctor_id:
        raise HTTPException(status_code=422, detail="Doctor accounts must be linked to a doctor record.")
    if user.role == "Patient" and not user.patient_id:
        raise HTTPException(status_code=422, detail="Patient accounts must be linked to a patient record.")
    try:
        return user_crud.create_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username or email is already in use.")


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_id == current_user.user_id and user.is_active is False:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")
    if user_id == current_user.user_id and user.role and user.role != current_user.role:
        raise HTTPException(status_code=400, detail="You can't change your own role.")
    try:
        db_user = user_crud.update_user(db, user_id, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username or email is already in use.")
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")
    db_user = user_crud.deactivate_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
