from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.auth_utils import hash_password, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str, exclude_user_id: int = None):
    if not email:
        return None
    query = db.query(User).filter(User.email == email)
    if exclude_user_id is not None:
        query = query.filter(User.user_id != exclude_user_id)
    return query.first()


def get_user_by_phone(db: Session, phone: str, exclude_user_id: int = None):
    if not phone:
        return None
    query = db.query(User).filter(User.phone == phone)
    if exclude_user_id is not None:
        query = query.filter(User.user_id != exclude_user_id)
    return query.first()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        phone=user.phone,
        doctor_id=user.doctor_id,
        patient_id=user.patient_id,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    data = user.model_dump(exclude_unset=True, exclude={"password"})
    for key, value in data.items():
        setattr(db_user, key, value)
    if user.password:
        db_user.password_hash = hash_password(user.password)
    # Keep deactivated_at in sync with is_active, however it got changed -
    # this is what the 30-day auto-purge clock is based on.
    if "is_active" in data:
        if data["is_active"] is False:
            db_user.deactivated_at = datetime.utcnow()
        else:
            db_user.deactivated_at = None
    db.commit()
    db.refresh(db_user)
    return db_user


def deactivate_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.is_active = False
        db_user.deactivated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user


def purge_expired_deactivated_users(db: Session, days: int = 30):
    """Permanently deletes accounts that have been deactivated for `days`
    or more. Audit log entries about that account are kept (they store the
    username as plain text already) but their link to the now-deleted
    account is cleared first, since the DB would otherwise refuse to
    delete a row still referenced by a foreign key.

    Returns the list of usernames that were purged, for logging/testing.
    """
    from app.models.audit_log import AuditLog

    cutoff = datetime.utcnow() - timedelta(days=days)
    expired = (
        db.query(User)
        .filter(User.is_active.is_(False))
        .filter(User.deactivated_at.isnot(None))
        .filter(User.deactivated_at < cutoff)
        .all()
    )

    purged_usernames = []
    for expired_user in expired:
        db.query(AuditLog).filter(AuditLog.actor_user_id == expired_user.user_id).update(
            {"actor_user_id": None}
        )
        purged_usernames.append(expired_user.username)
        db.delete(expired_user)

    if purged_usernames:
        db.commit()
    return purged_usernames


def is_locked(user: User) -> bool:
    return bool(user.locked_until and user.locked_until > datetime.utcnow())


def record_failed_login(db: Session, user: User):
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
    db.commit()


def reset_failed_login(db: Session, user: User):
    if user.failed_login_attempts or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
