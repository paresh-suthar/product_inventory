from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    role: Optional[str] = 'ADMIN'
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str
