from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.crud import user as user_crud
from app.auth_utils import require_roles
from app.models.user import User
from app.audit import log_event

# Every endpoint here is restricted to Admin - this is account management,
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=409, detail="That username is already taken.")
    if user_crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=409, detail="That email is already in use by another account.")
    if user_crud.get_user_by_phone(db, user.phone):
        raise HTTPException(status_code=409, detail="That phone number is already in use by another account.")
    if user.role == "Doctor" and not user.doctor_id:
        raise HTTPException(status_code=422, detail="Doctor accounts must be linked to a doctor record.")
    if user.role == "Patient" and not user.patient_id:
        raise HTTPException(status_code=422, detail="Patient accounts must be linked to a patient record.")
    try:
        new_user = user_crud.create_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username, email, or phone number is already in use.")
    log_event(
        db,
        action="user_created",
        actor_user=current_user,
        detail=f"created account '{new_user.username}' (role: {new_user.role})",
        request=request,
    )
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_id == current_user.user_id and user.is_active is False:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")
    if user_id == current_user.user_id and user.role and user.role != current_user.role:
        raise HTTPException(status_code=400, detail="You can't change your own role.")
    if user_crud.get_user_by_email(db, user.email, exclude_user_id=user_id):
        raise HTTPException(status_code=409, detail="That email is already in use by another account.")
    if user_crud.get_user_by_phone(db, user.phone, exclude_user_id=user_id):
        raise HTTPException(status_code=409, detail="That phone number is already in use by another account.")
    try:
        db_user = user_crud.update_user(db, user_id, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That email or phone number is already in use.")
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    changed_fields = [k for k in user.model_dump(exclude_unset=True, exclude={"password"}).keys()]
    if user.password:
        changed_fields.append("password")
    log_event(
        db,
        action="user_updated",
        actor_user=current_user,
        detail=f"updated account '{db_user.username}' (fields: {', '.join(changed_fields) or 'none'})",
        request=request,
    )
    return db_user


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")
    db_user = user_crud.deactivate_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    log_event(
        db,
        action="user_deactivated",
        actor_user=current_user,
        detail=f"deactivated account '{db_user.username}'",
        request=request,
    )
    return db_user
