from datetime import datetime

from pydantic import BaseModel


class IPAddressBase(BaseModel):
    ip_address: str
    subnet_mask: str = "255.255.255.0"
    gateway: str | None = None
    is_primary: bool = False
    status: str = "AVAILABLE"


class IPAddressCreate(IPAddressBase):
    server_id: str | None = None


class IPAddressResponse(IPAddressBase):
    id: str
    server_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ServerBase(BaseModel):
    hostname: str
    provider_id: str
    datacenter_location: str
    rack_node_id: str | None = None
    cpu: str
    ram_gb: int
    storage: str
    bandwidth: str = "1 Gbps Unmetered"
    primary_ip: str
    upstream_cost: float
    upstream_currency: str = "EUR"
    provider_renewal_day: int = 1
    status: str = "AVAILABLE"  # AVAILABLE, ASSIGNED, MAINTENANCE, TERMINATED
    notes: str | None = None


class ServerCreate(ServerBase):
    additional_ips: list[str] | None = []


class ServerUpdate(BaseModel):
    hostname: str | None = None
    provider_id: str | None = None
    datacenter_location: str | None = None
    rack_node_id: str | None = None
    cpu: str | None = None
    ram_gb: int | None = None
    storage: str | None = None
    bandwidth: str | None = None
    primary_ip: str | None = None
    upstream_cost: float | None = None
    upstream_currency: str | None = None
    provider_renewal_day: int | None = None
    status: str | None = None
    notes: str | None = None


class ServerResponse(ServerBase):
    id: str
    created_at: datetime
    ip_addresses: list[IPAddressResponse] = []

    class Config:
        from_attributes = True
