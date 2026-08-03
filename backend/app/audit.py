"""
Thin convenience wrapper around crud.audit_log so routers can log an event
in one line. Deliberately swallows any error - a logging failure should
never be the reason a real request (like a login) fails.
"""
from sqlalchemy.orm import Session
from app.crud import audit_log as audit_log_crud


def _client_ip(request):
    if request is None:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def log_event(db: Session, action: str, actor_user=None, actor_username=None, detail=None, request=None):
    try:
        audit_log_crud.create_audit_log(
            db,
            action=action,
            actor_user_id=getattr(actor_user, "user_id", None),
            actor_username=actor_username or getattr(actor_user, "username", None),
            detail=detail,
            ip_address=_client_ip(request),
        )
    except Exception:
        db.rollback()
