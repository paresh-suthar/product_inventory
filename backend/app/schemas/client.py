from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class WalletTransactionResponse(BaseModel):
    id: str
    amount: float
    currency: str
    transaction_type: str
    reference_id: Optional[str]
    notes: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class ClientWalletResponse(BaseModel):
    id: str
    currency: str
    balance: float
    transactions: List[WalletTransactionResponse] = []
    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None
    preferred_currency: str = 'USD'
    is_active: bool = True

class ClientCreate(ClientBase):
    initial_wallet_deposit: Optional[float] = 0.0

class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None
    preferred_currency: Optional[str] = None
    is_active: Optional[bool] = None

class ClientResponse(ClientBase):
    id: str
    created_at: datetime
    wallet: Optional[ClientWalletResponse] = None
    class Config:
        from_attributes = True

class WalletDepositRequest(BaseModel):
    amount: float
    currency: Optional[str] = None
    payment_method: str = 'BANK_WIRE'
    bank_account_id: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
