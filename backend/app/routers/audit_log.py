from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.audit_log import AuditLogResponse
from app.crud import audit_log as audit_log_crud
from app.auth_utils import require_roles
from app.models.user import User

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Log"])


@router.get("/", response_model=list[AuditLogResponse])
def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return audit_log_crud.get_audit_logs(db, skip=skip, limit=limit)
