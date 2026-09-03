from datetime import datetime

from pydantic import BaseModel


class ProviderBase(BaseModel):
    name: str
    contact_email: str | None = None
    portal_url: str | None = None
    account_number: str | None = None
    currency: str = "USD"
    support_phone: str | None = None
    is_active: bool = True


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: str | None = None
    contact_email: str | None = None
    portal_url: str | None = None
    account_number: str | None = None
    currency: str | None = None
    support_phone: str | None = None
    is_active: bool | None = None


class ProviderResponse(ProviderBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
