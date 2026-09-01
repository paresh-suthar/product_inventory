from sqlalchemy import Column, String, Numeric, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Server(TimeStampedBase):
    __tablename__ = 'servers'
    hostname = Column(String(150), unique=True, index=True, nullable=False)
    provider_id = Column(String(36), ForeignKey('providers.id'), nullable=False)
    datacenter_location = Column(String(150), nullable=False) # e.g. Falkenstein (DE), Hillsboro (US), Singapore (SG)
    rack_node_id = Column(String(100), nullable=True)
    
    # Specs
    cpu = Column(String(150), nullable=False) # e.g. AMD EPYC 7702 (64 Cores), Intel Xeon E-2276G
    ram_gb = Column(Integer, nullable=False) # e.g. 64, 128, 256
    storage = Column(String(150), nullable=False) # e.g. 2x 1.92TB NVMe SSD Datacenter Edition
    bandwidth = Column(String(100), default='1 Gbps Unmetered')
    primary_ip = Column(String(50), unique=True, index=True, nullable=False)
    
    # Cost & Status
    upstream_cost = Column(Numeric(14, 2), nullable=False) # Monthly cost charged by provider
    upstream_currency = Column(String(10), default='EUR')
    provider_renewal_day = Column(Integer, default=1) # Day of month
    
    status = Column(String(50), default='AVAILABLE') # AVAILABLE, ASSIGNED, MAINTENANCE, TERMINATED
    notes = Column(Text, nullable=True)
    
    provider = relationship('Provider', backref='servers')
    ip_addresses = relationship('IPAddress', back_populates='server', cascade='all, delete-orphan')

class IPAddress(TimeStampedBase):
    __tablename__ = 'ip_addresses'
    server_id = Column(String(36), ForeignKey('servers.id'), nullable=True)
    ip_address = Column(String(50), unique=True, index=True, nullable=False)
    subnet_mask = Column(String(50), default='255.255.255.0')
    gateway = Column(String(50), nullable=True)
    is_primary = Column(Boolean, default=False)
    status = Column(String(50), default='AVAILABLE') # AVAILABLE, ASSIGNED, RESERVED
    
    server = relationship('Server', back_populates='ip_addresses')
