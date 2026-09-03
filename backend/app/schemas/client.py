from datetime import datetime

from pydantic import BaseModel


class WalletTransactionResponse(BaseModel):
    id: str
    amount: float
    currency: str
    transaction_type: str
    reference_id: str | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ClientWalletResponse(BaseModel):
    id: str
    currency: str
    balance: float
    transactions: list[WalletTransactionResponse] = []

    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    company_name: str
    contact_name: str
    email: str
    phone: str | None = None
    billing_address: str | None = None
    tax_id: str | None = None
    preferred_currency: str = "USD"
    is_active: bool = True


class ClientCreate(ClientBase):
    initial_wallet_deposit: float | None = 0.0


class ClientUpdate(BaseModel):
    company_name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    billing_address: str | None = None
    tax_id: str | None = None
    preferred_currency: str | None = None
    is_active: bool | None = None


class ClientResponse(ClientBase):
    id: str
    created_at: datetime
    wallet: ClientWalletResponse | None = None

    class Config:
        from_attributes = True


class WalletDepositRequest(BaseModel):
    amount: float
    currency: str | None = None
    payment_method: str = "BANK_WIRE"
    bank_account_id: str | None = None
    reference_id: str | None = None
    notes: str | None = None
