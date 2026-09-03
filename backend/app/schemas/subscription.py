from datetime import datetime

from pydantic import BaseModel


class SubscriptionBase(BaseModel):
    client_id: str
    server_id: str
    plan_name: str
    selling_price: float
    currency: str = "USD"
    billing_cycle: str = "MONTHLY"  # MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    start_date: datetime | None = None
    next_due_date: datetime | None = None
    status: str = "ACTIVE"
    auto_renew_from_wallet: str = "YES"


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    plan_name: str | None = None
    selling_price: float | None = None
    currency: str | None = None
    billing_cycle: str | None = None
    next_due_date: datetime | None = None
    status: str | None = None
    auto_renew_from_wallet: str | None = None


class SubscriptionResponse(SubscriptionBase):
    id: str
    start_date: datetime
    next_due_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
