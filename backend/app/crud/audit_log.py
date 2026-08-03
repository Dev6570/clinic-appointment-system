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
