from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    email = Column(String(100), unique=True)
    phone = Column(String(15))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Links a Doctor-role account to their doctor record, and a Patient-role
    # account to their patient record. Null for Admin/Receptionist accounts.
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)

    # Basic brute-force protection
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(TIMESTAMP, nullable=True)