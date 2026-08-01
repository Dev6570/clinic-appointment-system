from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None

    class Config:
        from_attributes = True