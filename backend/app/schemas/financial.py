from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CurrencyBase(BaseModel):
    code: str
    name: str
    symbol: str
    exchange_rate_to_base: float = 1.0
    is_base: bool = False

class CurrencyCreate(CurrencyBase):
    pass

class CurrencyUpdate(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    exchange_rate_to_base: Optional[float] = None
    is_base: Optional[bool] = None

class CurrencyResponse(CurrencyBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class BankAccountBase(BaseModel):
    account_name: str
    account_type: str = 'BANK' # BANK, GATEWAY
    bank_name: str
    account_number: Optional[str] = None
    iban: Optional[str] = None
    swift_bic: Optional[str] = None
    routing_code: Optional[str] = None
    currency: str = 'USD'
    current_balance: float = 0.0
    is_active: bool = True

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    iban: Optional[str] = None
    swift_bic: Optional[str] = None
    routing_code: Optional[str] = None
    currency: Optional[str] = None
    current_balance: Optional[float] = None
    is_active: Optional[bool] = None

class BankAccountResponse(BankAccountBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class AccountTransferCreate(BaseModel):
    from_account_id: str
    to_account_id: str
    amount_sent: float
    fx_fee: Optional[float] = 0.0
    notes: Optional[str] = None

class AccountTransferResponse(BaseModel):
    id: str
    from_account_id: str
    to_account_id: str
    amount_sent: float
    currency_sent: str
    amount_received: float
    currency_received: str
    fx_fee: float
    notes: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
