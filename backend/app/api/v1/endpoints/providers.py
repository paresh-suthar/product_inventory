from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.provider import Provider
from app.schemas.provider import ProviderCreate, ProviderResponse, ProviderUpdate

router = APIRouter()


@router.get("", response_model=list[ProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Provider).order_by(Provider.name))
    return result.scalars().all()


@router.post("", response_model=ProviderResponse)
async def create_provider(req: ProviderCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Provider).where(Provider.name == req.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Provider name already exists")
    provider = Provider(**req.dict())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.put("/{id}", response_model=ProviderResponse)
async def update_provider(id: str, req: ProviderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Provider).where(Provider.id == id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    for key, value in req.dict(exclude_unset=True).items():
        setattr(provider, key, value)
    await db.commit()
    await db.refresh(provider)
    return provider
