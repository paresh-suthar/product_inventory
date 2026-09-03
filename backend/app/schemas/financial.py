from datetime import datetime

from pydantic import BaseModel


class CurrencyBase(BaseModel):
    code: str
    name: str
    symbol: str
    exchange_rate_to_base: float = 1.0
    is_base: bool = False


class CurrencyCreate(CurrencyBase):
    pass


class CurrencyUpdate(BaseModel):
    name: str | None = None
    symbol: str | None = None
    exchange_rate_to_base: float | None = None
    is_base: bool | None = None


class CurrencyResponse(CurrencyBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BankAccountBase(BaseModel):
    account_name: str
    account_type: str = "BANK"  # BANK, GATEWAY
    bank_name: str
    account_number: str | None = None
    iban: str | None = None
    swift_bic: str | None = None
    routing_code: str | None = None
    currency: str = "USD"
    current_balance: float = 0.0
    is_active: bool = True


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    account_name: str | None = None
    account_type: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    iban: str | None = None
    swift_bic: str | None = None
    routing_code: str | None = None
    currency: str | None = None
    current_balance: float | None = None
    is_active: bool | None = None


class BankAccountResponse(BankAccountBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class AccountTransferCreate(BaseModel):
    from_account_id: str
    to_account_id: str
    amount_sent: float
    fx_fee: float | None = 0.0
    notes: str | None = None


class AccountTransferResponse(BaseModel):
    id: str
    from_account_id: str
    to_account_id: str
    amount_sent: float
    currency_sent: str
    amount_received: float
    currency_received: str
    fx_fee: float
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True
