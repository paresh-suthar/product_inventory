from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class IPAddressBase(BaseModel):
    ip_address: str
    subnet_mask: str = '255.255.255.0'
    gateway: Optional[str] = None
    is_primary: bool = False
    status: str = 'AVAILABLE'

class IPAddressCreate(IPAddressBase):
    server_id: Optional[str] = None

class IPAddressResponse(IPAddressBase):
    id: str
    server_id: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ServerBase(BaseModel):
    hostname: str
    provider_id: str
    datacenter_location: str
    rack_node_id: Optional[str] = None
    cpu: str
    ram_gb: int
    storage: str
    bandwidth: str = '1 Gbps Unmetered'
    primary_ip: str
    upstream_cost: float
    upstream_currency: str = 'EUR'
    provider_renewal_day: int = 1
    status: str = 'AVAILABLE' # AVAILABLE, ASSIGNED, MAINTENANCE, TERMINATED
    notes: Optional[str] = None

class ServerCreate(ServerBase):
    additional_ips: Optional[List[str]] = []

class ServerUpdate(BaseModel):
    hostname: Optional[str] = None
    provider_id: Optional[str] = None
    datacenter_location: Optional[str] = None
    rack_node_id: Optional[str] = None
    cpu: Optional[str] = None
    ram_gb: Optional[int] = None
    storage: Optional[str] = None
    bandwidth: Optional[str] = None
    primary_ip: Optional[str] = None
    upstream_cost: Optional[float] = None
    upstream_currency: Optional[str] = None
    provider_renewal_day: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ServerResponse(ServerBase):
    id: str
    created_at: datetime
    ip_addresses: List[IPAddressResponse] = []
    class Config:
        from_attributes = True
