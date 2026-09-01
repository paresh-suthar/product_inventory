from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Currency(TimeStampedBase):
    __tablename__ = 'currencies'
    code = Column(String(10), unique=True, index=True, nullable=False) # USD, EUR, INR, AED, GBP, SAR
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False) # $, €, ₹, د.إ, £, ﷼
    exchange_rate_to_base = Column(Numeric(14, 6), default=1.0) # 1 base_currency = X this_currency
    is_base = Column(Boolean, default=False)

class BankAccount(TimeStampedBase):
    __tablename__ = 'bank_accounts'
    account_name = Column(String(150), nullable=False) # e.g. Chase USD Operating, Wise Multi-Currency, HDFC INR
    account_type = Column(String(50), default='BANK') # BANK, GATEWAY (Stripe, PayPal, Wise, Payoneer)
    bank_name = Column(String(150), nullable=False)
    account_number = Column(String(100), nullable=True)
    iban = Column(String(100), nullable=True)
    swift_bic = Column(String(50), nullable=True)
    routing_code = Column(String(50), nullable=True) # IFSC / Routing
    currency = Column(String(10), default='USD')
    current_balance = Column(Numeric(14, 2), default=0.0)
    is_active = Column(Boolean, default=True)

class AccountTransfer(TimeStampedBase):
    __tablename__ = 'account_transfers'
    from_account_id = Column(String(36), ForeignKey('bank_accounts.id'), nullable=False)
    to_account_id = Column(String(36), ForeignKey('bank_accounts.id'), nullable=False)
    amount_sent = Column(Numeric(14, 2), nullable=False)
    currency_sent = Column(String(10), nullable=False)
    amount_received = Column(Numeric(14, 2), nullable=False)
    currency_received = Column(String(10), nullable=False)
    fx_fee = Column(Numeric(14, 2), default=0.0)
    notes = Column(String(255), nullable=True)
