from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(TIMESTAMP, server_default=func.now(), index=True)

    # actor_user_id is nullable: a failed login against a username that
    # doesn't exist has no real user to link to. actor_username is captured
    # directly (not just via the FK) so the log stays readable even if the
    # account is later deleted, renamed, or never existed.
    actor_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    actor_username = Column(String(100), nullable=True)

    action = Column(String(50), nullable=False, index=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
