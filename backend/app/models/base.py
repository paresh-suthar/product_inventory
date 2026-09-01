import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class TimeStampedBase(Base):
    __abstract__ = True
    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=utcnow_naive)
    updated_at = Column(DateTime, default=utcnow_naive, onupdate=utcnow_naive)
