from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship

from app.models.base import TimeStampedBase


class Subscription(TimeStampedBase):
    __tablename__ = "subscriptions"
    client_id = Column(String(36), ForeignKey("clients.id"), nullable=False)
    server_id = Column(String(36), ForeignKey("servers.id"), nullable=False)

    plan_name = Column(String(150), nullable=False)  # e.g. Dedicated AMD EPYC Enterprise Plan
    selling_price = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default="USD")
    billing_cycle = Column(String(50), default="MONTHLY")  # MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL

    start_date = Column(DateTime, nullable=False)
    next_due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, SUSPENDED, CANCELLED
    auto_renew_from_wallet = Column(String(10), default="YES")

    client = relationship("Client", backref="subscriptions")
    server = relationship("Server", backref="subscriptions")
