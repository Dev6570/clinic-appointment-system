from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import doctor, patient, appointment, auth, dashboard

# Creates any tables that don't exist yet (safe — won't touch existing ones)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinic Appointment & Patient Desk API")

# Allows the React frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(doctor.router)
app.include_router(patient.router)
app.include_router(appointment.router)
app.include_router(auth.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "Clinic Appointment & Patient Desk API is running"}