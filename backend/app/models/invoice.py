from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Invoice(TimeStampedBase):
    __tablename__ = 'invoices'
    invoice_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. INV-2026-0001
    subscription_id = Column(String(36), ForeignKey('subscriptions.id'), nullable=True)
    client_id = Column(String(36), ForeignKey('clients.id'), nullable=False)
    bank_account_id = Column(String(36), ForeignKey('bank_accounts.id'), nullable=True)
    
    subtotal = Column(Numeric(14, 2), nullable=False)
    tax_amount = Column(Numeric(14, 2), default=0.0)
    total_amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default='USD')
    
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default='UNPAID') # UNPAID, PAID, CANCELLED, OVERDUE
    notes = Column(String(255), nullable=True)
    
    client = relationship('Client', backref='invoices')
    subscription = relationship('Subscription', backref='invoices')
    bank_account = relationship('BankAccount')
    payments = relationship('Payment', back_populates='invoice', cascade='all, delete-orphan')

class Payment(TimeStampedBase):
    __tablename__ = 'payments'
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=False)
    bank_account_id = Column(String(36), ForeignKey('bank_accounts.id'), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default='USD')
    payment_method = Column(String(50), default='BANK_WIRE') # BANK_WIRE, CARD, STRIPE, PAYPAL, WALLET
    transaction_ref = Column(String(150), nullable=True)
    paid_at = Column(DateTime, nullable=False)
    
    invoice = relationship('Invoice', back_populates='payments')
    bank_account = relationship('BankAccount')
