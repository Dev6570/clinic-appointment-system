from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True)
    doctor_name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)
    phone = Column(String(15))
    email = Column(String(100), unique=True)
    experience = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())