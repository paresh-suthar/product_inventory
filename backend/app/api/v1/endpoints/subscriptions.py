import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.server import Server
from app.models.subscription import Subscription
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
)
from app.services.billing_service import (
    auto_debit_wallet_if_possible,
    generate_subscription_invoice,
)

router = APIRouter()


@router.get("", response_model=list[SubscriptionResponse])
async def list_subscriptions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription).order_by(Subscription.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=SubscriptionResponse)
async def create_subscription(req: SubscriptionCreate, db: AsyncSession = Depends(get_db)):
    server_res = await db.execute(select(Server).where(Server.id == req.server_id))
    server = server_res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    start_date = req.start_date or datetime.now(timezone.utc).replace(tzinfo=None)
    next_due_date = req.next_due_date or (start_date + timedelta(days=30))

    sub = Subscription(
        id=str(uuid.uuid4()),
        client_id=req.client_id,
        server_id=req.server_id,
        plan_name=req.plan_name,
        selling_price=req.selling_price,
        currency=req.currency,
        billing_cycle=req.billing_cycle,
        start_date=start_date,
        next_due_date=next_due_date,
        status="ACTIVE",
        auto_renew_from_wallet=req.auto_renew_from_wallet,
    )
    db.add(sub)

    # Mark server as ASSIGNED
    server.status = "ASSIGNED"

    await db.commit()
    await db.refresh(sub)

    # Automatically generate first invoice
    invoice = await generate_subscription_invoice(db, sub.id)
    if req.auto_renew_from_wallet == "YES":
        await auto_debit_wallet_if_possible(db, invoice.id)

    return sub
