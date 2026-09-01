import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.server import Server, IPAddress
from app.schemas.server import ServerCreate, ServerUpdate, ServerResponse, IPAddressCreate, IPAddressResponse

router = APIRouter()

@router.get('', response_model=List[ServerResponse])
async def list_servers(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Server).options(selectinload(Server.ip_addresses)).order_by(Server.created_at.desc())
    if status:
        query = query.where(Server.status == status.upper())
    result = await db.execute(query)
    return result.scalars().all()

@router.get('/{id}', response_model=ServerResponse)
async def get_server(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    return server

@router.post('', response_model=ServerResponse)
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
        status=req.status or 'AVAILABLE',
        notes=req.notes
    )
    db.add(server)
    
    # Add primary IP
    p_ip = IPAddress(
        id=str(uuid.uuid4()),
        server_id=server_id,
        ip_address=req.primary_ip,
        is_primary=True,
        status='ASSIGNED'
    )
    db.add(p_ip)
    
    # Add any extra secondary IPs
    for ip in req.additional_ips or []:
        if ip and ip != req.primary_ip:
            sec_ip = IPAddress(
                id=str(uuid.uuid4()),
                server_id=server_id,
                ip_address=ip,
                is_primary=False,
                status='AVAILABLE'
            )
            db.add(sec_ip)
            
    await db.commit()
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == server_id))
    return result.scalar_one()

@router.put('/{id}', response_model=ServerResponse)
async def update_server(id: str, req: ServerUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Server).options(selectinload(Server.ip_addresses)).where(Server.id == id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    for key, value in req.dict(exclude_unset=True).items():
        setattr(server, key, value)
    await db.commit()
    await db.refresh(server)
    return server
