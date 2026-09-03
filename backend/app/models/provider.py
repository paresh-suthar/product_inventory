from sqlalchemy import Boolean, Column, String

from app.models.base import TimeStampedBase


class Provider(TimeStampedBase):
    __tablename__ = "providers"
    name = Column(String(150), unique=True, index=True, nullable=False)  # e.g. Hetzner Online, OVHcloud, AWS, Leaseweb
    contact_email = Column(String(150), nullable=True)
    portal_url = Column(String(255), nullable=True)
    account_number = Column(String(100), nullable=True)
    currency = Column(String(10), default="USD")
    support_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
