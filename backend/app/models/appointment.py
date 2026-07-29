from sqlalchemy import Column, Integer, String, Text, Date, Time, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="Scheduled")
    remarks = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    patient = relationship("Patient")
    doctor = relationship("Doctor")