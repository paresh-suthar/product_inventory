from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.financial import Currency
from app.core.config import settings

async def get_conversion_rate(session: AsyncSession, from_currency: str, to_currency: str) -> float:
    if from_currency == to_currency:
        return 1.0
    
    result = await session.execute(select(Currency))
    currencies = {c.code: float(c.exchange_rate_to_base) for c in result.scalars().all()}
    
    # All exchange_rate_to_base represent: 1 BASE = rate TARGET
    rate_from = currencies.get(from_currency, 1.0)
    rate_to = currencies.get(to_currency, 1.0)
    
    if rate_from == 0:
        return 1.0
    
    # Convert from -> BASE -> to
    # 1 from = (1 / rate_from) BASE = (1 / rate_from) * rate_to
    return rate_to / rate_from

async def convert_currency(session: AsyncSession, amount: float, from_currency: str, to_currency: str) -> float:
    rate = await get_conversion_rate(session, from_currency, to_currency)
    return round(amount * rate, 2)
