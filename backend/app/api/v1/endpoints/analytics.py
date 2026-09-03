from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.client import Client
from app.models.financial import BankAccount
from app.models.server import Server
from app.models.subscription import Subscription
from app.schemas.analytics import AnalyticsSummary, BankBalanceSummary, RenewalAlert
from app.services.fx_service import convert_currency

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    base_curr = settings.BASE_CURRENCY

    # 1. Servers & MRR
    servers_res = await db.execute(select(Server))
    servers = servers_res.scalars().all()
    total_servers = len(servers)
    avail_servers = len([s for s in servers if s.status == "AVAILABLE"])
    assigned_servers = len([s for s in servers if s.status == "ASSIGNED"])

    total_upstream_base = 0.0
    for s in servers:
        cost_in_base = await convert_currency(db, float(s.upstream_cost), s.upstream_currency, base_curr)
        total_upstream_base += cost_in_base

    subs_res = await db.execute(select(Subscription).where(Subscription.status == "ACTIVE"))
    subs = subs_res.scalars().all()
    mrr_base = 0.0
    for sub in subs:
        price_in_base = await convert_currency(db, float(sub.selling_price), sub.currency, base_curr)
        mrr_base += price_in_base

    net_profit_base = mrr_base - total_upstream_base
    margin_pct = (net_profit_base / mrr_base * 100) if mrr_base > 0 else 0.0

    # 2. Bank balances
    banks_res = await db.execute(select(BankAccount).where(BankAccount.is_active == True))
    banks = banks_res.scalars().all()
    bank_summaries = []
    total_bank_base = 0.0
    for b in banks:
        bal_base = await convert_currency(db, float(b.current_balance), b.currency, base_curr)
        total_bank_base += bal_base
        bank_summaries.append(
            BankBalanceSummary(
                id=b.id,
                account_name=b.account_name,
                bank_name=b.bank_name,
                currency=b.currency,
                balance=float(b.current_balance),
                balance_in_base=bal_base,
            )
        )

    # 3. Clients
    clients_res = await db.execute(select(Client))
    total_clients = len(clients_res.scalars().all())

    # 4. Renewals
    renewals = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for sub in subs:
        if sub.next_due_date:
            days = (sub.next_due_date - now).days
            if days <= 14:
                renewals.append(
                    RenewalAlert(
                        id=sub.id,
                        type="CLIENT_SUBSCRIPTION",
                        name=f"{sub.plan_name}",
                        due_date=sub.next_due_date.strftime("%Y-%m-%d"),
                        amount=float(sub.selling_price),
                        currency=sub.currency,
                        days_left=max(days, 0),
                    )
                )

    return AnalyticsSummary(
        base_currency=base_curr,
        mrr_base=round(mrr_base, 2),
        total_upstream_cost_base=round(total_upstream_base, 2),
        net_profit_base=round(net_profit_base, 2),
        profit_margin_percentage=round(margin_pct, 1),
        total_servers=total_servers,
        available_servers=avail_servers,
        assigned_servers=assigned_servers,
        total_clients=total_clients,
        total_bank_balance_base=round(total_bank_base, 2),
        bank_balances=bank_summaries,
        upcoming_renewals=renewals,
    )
