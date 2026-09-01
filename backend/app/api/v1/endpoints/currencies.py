from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.financial import Currency
from app.schemas.financial import CurrencyCreate, CurrencyUpdate, CurrencyResponse

router = APIRouter()

@router.get('', response_model=List[CurrencyResponse])
async def list_currencies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Currency).order_by(Currency.code))
    return result.scalars().all()

@router.post('', response_model=CurrencyResponse)
async def create_currency(req: CurrencyCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Currency).where(Currency.code == req.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail='Currency code already exists')
    
    currency = Currency(
        code=req.code.upper(),
        name=req.name,
        symbol=req.symbol,
        exchange_rate_to_base=req.exchange_rate_to_base,
        is_base=req.is_base
    )
    db.add(currency)
    await db.commit()
    await db.refresh(currency)
    return currency

@router.put('/{code}', response_model=CurrencyResponse)
async def update_currency(code: str, req: CurrencyUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Currency).where(Currency.code == code.upper()))
    currency = result.scalar_one_or_none()
    if not currency:
        raise HTTPException(status_code=404, detail='Currency not found')
    
    for key, value in req.dict(exclude_unset=True).items():
        setattr(currency, key, value)
        
    await db.commit()
    await db.refresh(currency)
    return currency
