from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_doctors: int
    total_patients: int
    total_appointments: int
    scheduled_appointments: int
    completed_appointments: int
    cancelled_appointments: int

class TodayStats(BaseModel):
    date: str
    appointments_today: int
    scheduled_today: int
    completed_today: int
    cancelled_today: int