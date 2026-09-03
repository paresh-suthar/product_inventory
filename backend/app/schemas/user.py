from datetime import datetime

from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: str
    role: str | None = "ADMIN"
    is_active: bool | None = True


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
