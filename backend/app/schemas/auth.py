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

    class Config:
        from_attributes = True