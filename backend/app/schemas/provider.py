from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ProviderBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    portal_url: Optional[str] = None
    account_number: Optional[str] = None
    currency: str = 'USD'
    support_phone: Optional[str] = None
    is_active: bool = True

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    portal_url: Optional[str] = None
    account_number: Optional[str] = None
    currency: Optional[str] = None
    support_phone: Optional[str] = None
    is_active: Optional[bool] = None

class ProviderResponse(ProviderBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True
