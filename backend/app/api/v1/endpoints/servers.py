import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.server import IPAddress, Server
from app.models.subscription import Subscription
from app.schemas.server import (
    ServerCreate,
    ServerIPCreate,
    ServerResponse,
    ServerUpdate,
)

router = APIRouter()


@router.get("", response_model=list[ServerResponse])
async def list_servers(status: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Server).options(selectinload(Server.ip_addresses)).order_by(Server.created_at.desc())
    if status:
        query = query.where(Server.status == status.upper())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{id}", response_model=ServerResponse)
async def get_server(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.post("", response_model=ServerResponse)
async def create_server(req: ServerCreate, db: AsyncSession = Depends(get_db)):
    server_id = str(uuid.uuid4())
    server = Server(
        id=server_id,
        hostname=req.hostname,
        provider_id=req.provider_id,
        datacenter_location=req.datacenter_location,
        rack_node_id=req.rack_node_id,
        cpu=req.cpu,
        ram_gb=req.ram_gb,
        storage=req.storage,
        bandwidth=req.bandwidth,
        primary_ip=req.primary_ip,
        upstream_cost=req.upstream_cost,
        upstream_currency=req.upstream_currency,
        provider_renewal_day=req.provider_renewal_day,
        status=req.status or "AVAILABLE",
        notes=req.notes,
    )
    db.add(server)

    # Add primary IP
    p_ip = IPAddress(
        id=str(uuid.uuid4()), server_id=server_id, ip_address=req.primary_ip, is_primary=True, status="ASSIGNED"
    )
    db.add(p_ip)

    # Add any extra secondary IPs
    for ip in req.additional_ips or []:
        if ip and ip != req.primary_ip:
            sec_ip = IPAddress(
                id=str(uuid.uuid4()), server_id=server_id, ip_address=ip, is_primary=False, status="AVAILABLE"
            )
            db.add(sec_ip)

    await db.commit()
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == server_id))
    return result.scalar_one()


@router.put("/{id}", response_model=ServerResponse)
async def update_server(id: str, req: ServerUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    for key, value in req.dict(exclude_unset=True).items():
        setattr(server, key, value)
    await db.commit()
    await db.refresh(server)
    return server


@router.delete("/{id}")
async def delete_server(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if server.status == "ASSIGNED":
        raise HTTPException(
            status_code=400, detail="Cannot delete an assigned server. Please unassign or release it first."
        )

    # Delete associated IPs
    for ip in server.ip_addresses:
        await db.delete(ip)
    await db.delete(server)
    await db.commit()
    return {"message": "Server deleted successfully", "id": id}


@router.post("/{id}/action")
async def server_power_action(id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    action = payload.get("action", "REBOOT").upper()
    result = await db.execute(select(Server).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if action == "RESCUE":
        server.status = "MAINTENANCE"
        server.notes = (server.notes or "") + " [System booted in Rescue Netboot Mode]"
    elif action == "POWER_OFF":
        server.status = "MAINTENANCE"
    elif action in ["POWER_ON", "REBOOT", "POWER_CYCLE"]:
        if server.status == "MAINTENANCE":
            server.status = "AVAILABLE"

    await db.commit()
    await db.refresh(server)
    return {"message": f"Power action '{action}' executed successfully on {server.hostname}", "status": server.status}


@router.post("/{id}/release")
async def release_server_from_client(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Mark associated active subscriptions as TERMINATED
    sub_res = await db.execute(
        select(Subscription).where(Subscription.server_id == id, Subscription.status == "ACTIVE")
    )
    for sub in sub_res.scalars().all():
        sub.status = "TERMINATED"

    server.status = "AVAILABLE"
    await db.commit()
    await db.refresh(server)
    return {
        "message": f"Server {server.hostname} released and returned to available inventory",
        "status": server.status,
    }


@router.post("/{id}/ips")
async def add_server_ip(id: str, req: ServerIPCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    new_ip = IPAddress(
        id=str(uuid.uuid4()),
        server_id=id,
        ip_address=req.ip_address,
        subnet_mask=req.subnet_mask or "255.255.255.255",
        reverse_dns=req.reverse_dns,
        is_primary=req.is_primary or False,
        status="AVAILABLE",
    )
    db.add(new_ip)
    await db.commit()
    return {"message": "IP address added to server pool", "ip_address": req.ip_address}


@router.delete("/{id}/ips/{ip_id}")
async def delete_server_ip(id: str, ip_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IPAddress).where(IPAddress.id == ip_id, IPAddress.server_id == id))
    ip = result.scalar_one_or_none()
    if not ip:
        raise HTTPException(status_code=404, detail="IP address not found on server")
    if ip.is_primary:
        raise HTTPException(status_code=400, detail="Cannot delete the primary IP address")

    await db.delete(ip)
    await db.commit()
    return {"message": "IP address deleted", "id": ip_id}
