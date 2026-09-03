from sqlalchemy import Boolean, Column, String

from app.models.base import TimeStampedBase


class User(TimeStampedBase):
    __tablename__ = "users"
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="ADMIN")  # ADMIN, PROCUREMENT, SALES, SUPPORT
    is_active = Column(Boolean, default=True)
