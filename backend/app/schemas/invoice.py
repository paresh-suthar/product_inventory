from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PaymentBase(BaseModel):
    amount: float
    currency: str = 'USD'
    payment_method: str = 'BANK_WIRE'
    bank_account_id: Optional[str] = None
    transaction_ref: Optional[str] = None
    paid_at: Optional[datetime] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    invoice_id: str
    paid_at: datetime
    created_at: datetime
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    client_id: str
    subscription_id: Optional[str] = None
    bank_account_id: Optional[str] = None
    subtotal: float
    tax_amount: float = 0.0
    total_amount: float
    currency: str = 'USD'
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: str = 'UNPAID'
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: str
    invoice_no: str
    issue_date: datetime
    due_date: datetime
    created_at: datetime
    payments: List[PaymentResponse] = []
    class Config:
        from_attributes = True
