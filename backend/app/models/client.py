from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Client(TimeStampedBase):
    __tablename__ = 'clients'
    company_name = Column(String(200), nullable=False)
    contact_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    billing_address = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True) # VAT / GST Number
    preferred_currency = Column(String(10), default='USD')
    is_active = Column(Boolean, default=True)
    
    wallet = relationship('ClientWallet', back_populates='client', uselist=False, cascade='all, delete-orphan')

class ClientWallet(TimeStampedBase):
    __tablename__ = 'client_wallets'
    client_id = Column(String(36), ForeignKey('clients.id'), unique=True, nullable=False)
    currency = Column(String(10), default='USD')
    balance = Column(Numeric(14, 2), default=0.0)
    
    client = relationship('Client', back_populates='wallet')
    transactions = relationship('WalletTransaction', back_populates='wallet', cascade='all, delete-orphan')

class WalletTransaction(TimeStampedBase):
    __tablename__ = 'wallet_transactions'
    wallet_id = Column(String(36), ForeignKey('client_wallets.id'), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False) # positive for deposit, negative for debit
    currency = Column(String(10), default='USD')
    transaction_type = Column(String(50), nullable=False) # DEPOSIT, RENEWAL_DEBIT, REFUND, ADJUSTMENT
    reference_id = Column(String(100), nullable=True) # e.g. Invoice ID or Bank Ref
    notes = Column(String(255), nullable=True)
    
    wallet = relationship('ClientWallet', back_populates='transactions')
