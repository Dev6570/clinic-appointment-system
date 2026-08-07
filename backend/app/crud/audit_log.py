from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def create_audit_log(db: Session, action: str, actor_user_id=None, actor_username=None, detail=None, ip_address=None):
    entry = AuditLog(
        action=action,
        actor_user_id=actor_user_id,
        actor_username=actor_username,
        detail=detail,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
    return entry


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def purge_old_audit_logs(db: Session, days: int = 180):
    """Permanently deletes audit log entries older than `days`. Same
    opportunistic, best-effort pattern as the account and appointment
    purges in crud/user.py and crud/appointment.py - there's no background
    scheduler in this app, so this runs on every login instead.

    Returns the count purged, for logging/testing.
    """
    # AuditLog.timestamp is a naive TIMESTAMP column (no timezone stored),
    # so the cutoff has to be naive too - get the time the modern,
    # non-deprecated way, then strip the tzinfo to match.
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    old_logs = db.query(AuditLog).filter(AuditLog.timestamp < cutoff)
    purged_count = old_logs.count()
    if purged_count:
        old_logs.delete(synchronize_session=False)
        db.commit()
    return purged_count
