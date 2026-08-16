from sqlalchemy import Column, Integer, String, Text, Date, Time, TIMESTAMP, ForeignKey, Index, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # Prevents double-booking the same doctor at the same date and
        # time. Partial (WHERE status != 'Cancelled') on purpose - a
        # cancelled appointment shouldn't permanently block that slot from
        # being rebooked, and this app has no scheduler to promptly purge
        # cancelled rows (they're only cleaned up opportunistically on
        # login). Mirrored in migrations/005_prevent_doctor_double_booking.sql
        # for the real Postgres database, same pattern as the phone
        # uniqueness constraint (see User.phone below / migration 003).
        Index(
            "ix_appointments_no_double_booking",
            "doctor_id", "appointment_date", "appointment_time",
            unique=True,
            postgresql_where=text("status != 'Cancelled'"),
            sqlite_where=text("status != 'Cancelled'"),
        ),
    )

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