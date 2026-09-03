from datetime import datetime

from pydantic import BaseModel


class PaymentBase(BaseModel):
    amount: float
    currency: str = "USD"
    payment_method: str = "BANK_WIRE"
    bank_account_id: str | None = None
    transaction_ref: str | None = None
    paid_at: datetime | None = None


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
    subscription_id: str | None = None
    bank_account_id: str | None = None
    subtotal: float
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "USD"
    issue_date: datetime | None = None
    due_date: datetime | None = None
    status: str = "UNPAID"
    notes: str | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(InvoiceBase):
    id: str
    invoice_no: str
    issue_date: datetime
    due_date: datetime
    created_at: datetime
    payments: list[PaymentResponse] = []

    class Config:
        from_attributes = True
