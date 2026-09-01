from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class SubscriptionBase(BaseModel):
    client_id: str
    server_id: str
    plan_name: str
    selling_price: float
    currency: str = 'USD'
    billing_cycle: str = 'MONTHLY' # MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    start_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    status: str = 'ACTIVE'
    auto_renew_from_wallet: str = 'YES'

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = None
    selling_price: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    next_due_date: Optional[datetime] = None
    status: Optional[str] = None
    auto_renew_from_wallet: Optional[str] = None

class SubscriptionResponse(SubscriptionBase):
    id: str
    start_date: datetime
    next_due_date: datetime
    created_at: datetime
    class Config:
        from_attributes = True
