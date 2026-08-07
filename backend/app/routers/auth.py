from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas.auth import Token, UserProfile, SignupRequest
from app.schemas.user import UserCreate
from app.auth_utils import verify_password, create_access_token, get_current_user
from app.crud import user as user_crud
from app.crud import patient as patient_crud
from app.crud import appointment as appointment_crud
from app.crud import audit_log as audit_log_crud
from app.rate_limit import enforce_login_rate_limit
from app.audit import log_event

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(enforce_login_rate_limit),
):
    # Best-effort housekeeping, all three run here for the same reason:
    # login is the most reliable "someone is using the app right now"
    # touchpoint, since this app has no separate background job scheduler.
    # Never allowed to block a real login.
    try:
        purged = user_crud.purge_expired_deactivated_users(db)
        for username in purged:
            log_event(db, action="account_purged", actor_username=username,
                      detail="auto-deleted after 30+ days deactivated", request=request)
    except Exception:
        db.rollback()

    try:
        cancelled_count, overdue_count = appointment_crud.purge_stale_appointments(db)
        if cancelled_count or overdue_count:
            log_event(
                db, action="appointments_purged", request=request,
                detail=f"removed {cancelled_count} cancelled and {overdue_count} overdue-scheduled appointment(s)",
            )
    except Exception:
        db.rollback()

    try:
        # 180-day retention. Runs last and logs its own purge afterward -
        # that new entry is newer than the cutoff, so it survives as a
        # record that the purge happened.
        audit_purged_count = audit_log_crud.purge_old_audit_logs(db, days=180)
        if audit_purged_count:
            log_event(
                db, action="audit_logs_purged", request=request,
                detail=f"removed {audit_purged_count} audit log entr{'y' if audit_purged_count == 1 else 'ies'} older than 180 days",
            )
    except Exception:
        db.rollback()

    # Same generic error message for "no such user" and "wrong password" so a
    # bad actor can't use the response to enumerate valid usernames.
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

    user = user_crud.get_user_by_username(db, form_data.username)
    if not user:
        log_event(db, action="login_failed", actor_username=form_data.username, detail="no such user", request=request)
        raise generic_error

    if not user.is_active:
        log_event(db, action="login_failed", actor_user=user, detail="account deactivated", request=request)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact an administrator.",
        )

    if user_crud.is_locked(user):
        log_event(db, action="login_failed", actor_user=user, detail="account locked", request=request)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Too many failed attempts. This account is temporarily locked - try again in a few minutes.",
        )

    if not verify_password(form_data.password, user.password_hash):
        user_crud.record_failed_login(db, user)
        log_event(db, action="login_failed", actor_user=user, detail="wrong password", request=request)
        raise generic_error

    user_crud.reset_failed_login(db, user)
    log_event(db, action="login_success", actor_user=user, request=request)
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/signup", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def signup(
    signup_data: SignupRequest,
    request: Request,
    db: Session = Depends(get_db),
    # Reuses the login rate limiter on purpose - it's keyed on client IP,
    # not the endpoint, so a burst of signup attempts from one network
    # counts against the same window as login attempts. That's the
    # behavior we want: it's still "a lot of auth traffic from one IP."
    _rate_limit: None = Depends(enforce_login_rate_limit),
):
    if user_crud.get_user_by_username(db, signup_data.username):
        raise HTTPException(status_code=409, detail="That username is already taken.")

    # Try to link to an existing patient record (e.g. one a receptionist
    # already registered during a walk-in visit) by matching email or
    # phone. Falls back to creating a new patient record from the signup
    # details if no match is found.
    patient = patient_crud.get_patient_by_email(db, signup_data.email)
    if not patient and signup_data.phone:
        patient = patient_crud.get_patient_by_phone(db, signup_data.phone)

    is_new_patient = patient is None

    if patient and db.query(User).filter(User.patient_id == patient.patient_id).first():
        # Someone (an admin, or this same person previously) already has a
        # login linked to this patient record.
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this patient record. Try logging in, or contact the clinic to reset your password.",
        )

    if is_new_patient:
        # Deliberately NOT using patient_crud.create_patient() here - that
        # function commits immediately, which would leave an orphaned
        # patient record (no login attached) if the checks below fail.
        # Adding + flushing keeps it in this same uncommitted transaction,
        # so it's only ever saved together with the user account, or not
        # at all.
        patient = Patient(
            patient_name=signup_data.full_name,
            age=signup_data.age,
            gender=signup_data.gender,
            phone=signup_data.phone,
            email=signup_data.email,
            address=signup_data.address,
        )
        db.add(patient)
        db.flush()  # assigns patient.patient_id without committing

    # Same rule as admin-created accounts (routers/user.py): a Patient
    # account's contact info always comes from the linked patient record,
    # never entered independently. This also enforces the "unique across
    # every role" rule from the RBAC round, not just uniqueness among
    # patients.
    email_conflict = user_crud.get_user_by_email(db, patient.email)
    phone_conflict = user_crud.get_user_by_phone(db, patient.phone)
    if email_conflict or phone_conflict:
        db.rollback()  # discards the flushed-but-uncommitted new patient, if any
        field = "email" if email_conflict else "phone number"
        raise HTTPException(status_code=409, detail=f"An account already exists for that {field}. Try logging in instead.")

    new_user_data = UserCreate(
        username=signup_data.username,
        password=signup_data.password,
        full_name=signup_data.full_name,
        role="Patient",
        email=patient.email,
        phone=patient.phone,
        patient_id=patient.patient_id,
    )
    try:
        new_user = user_crud.create_user(db, new_user_data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username, email, or phone number is already in use.")

    log_event(
        db,
        action="self_signup",
        actor_user=new_user,
        detail=f"self-registered account '{new_user.username}' linked to patient #{patient.patient_id}",
        request=request,
    )
    return new_user


@router.get("/profile", response_model=UserProfile)
def read_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log_event(db, action="logout", actor_user=current_user, request=request)
    return {"message": "Logged out. Please delete the token on the client side."}
