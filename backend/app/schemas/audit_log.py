from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    timestamp: Optional[datetime] = None
    actor_user_id: Optional[int] = None
    actor_username: Optional[str] = None
    action: str
    detail: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True
