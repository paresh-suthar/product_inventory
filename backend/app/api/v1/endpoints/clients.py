import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.client import Client, ClientWallet, WalletTransaction
from app.models.financial import BankAccount
from app.models.subscription import Subscription
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    ClientWalletResponse,
    WalletDepositRequest,
)

router = APIRouter()


@router.get("", response_model=list[ClientResponse])
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .order_by(Client.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ClientResponse)
async def create_client(req: ClientCreate, db: AsyncSession = Depends(get_db)):
    client_id = str(uuid.uuid4())
    client = Client(
        id=client_id,
        company_name=req.company_name,
        contact_name=req.contact_name,
        email=req.email,
        phone=req.phone,
        billing_address=req.billing_address,
        tax_id=req.tax_id,
        preferred_currency=req.preferred_currency,
        is_active=req.is_active,
    )
    db.add(client)

    wallet_id = str(uuid.uuid4())
    wallet = ClientWallet(
        id=wallet_id, client_id=client_id, currency=req.preferred_currency, balance=req.initial_wallet_deposit or 0.0
    )
    db.add(wallet)

    if req.initial_wallet_deposit and req.initial_wallet_deposit > 0:
        tx = WalletTransaction(
            id=str(uuid.uuid4()),
            wallet_id=wallet_id,
            amount=req.initial_wallet_deposit,
            currency=req.preferred_currency,
            transaction_type="DEPOSIT",
            notes="Initial account opening deposit",
        )
        db.add(tx)

    await db.commit()
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .where(Client.id == client_id)
    )
    return result.scalar_one()


@router.post("/{id}/wallet/deposit", response_model=ClientWalletResponse)
async def deposit_to_wallet(id: str, req: WalletDepositRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .where(Client.id == id)
    )
    client = result.scalar_one_or_none()
    if not client or not client.wallet:
        raise HTTPException(status_code=404, detail="Client wallet not found")

    wallet = client.wallet
    wallet.balance = float(wallet.balance) + req.amount

    # If bank account was specified, update company bank balance
    if req.bank_account_id:
        bank_res = await db.execute(select(BankAccount).where(BankAccount.id == req.bank_account_id))
        bank = bank_res.scalar_one_or_none()
        if bank:
            bank.current_balance = float(bank.current_balance) + req.amount

    tx = WalletTransaction(
        id=str(uuid.uuid4()),
        wallet_id=wallet.id,
        amount=req.amount,
        currency=req.currency or wallet.currency,
        transaction_type="DEPOSIT",
        reference_id=req.reference_id,
        notes=req.notes or f"Deposit via {req.payment_method}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet


@router.get("/{id}")
async def get_client_details(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .where(Client.id == id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Also fetch client's subscriptions and servers
    subs_res = await db.execute(
        select(Subscription).options(selectinload(Subscription.server)).where(Subscription.client_id == id)
    )
    subs = subs_res.scalars().all()

    return {"client": client, "subscriptions": subs}


@router.put("/{id}", response_model=ClientResponse)
async def update_client(id: str, req: ClientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .where(Client.id == id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for key, value in req.dict(exclude_unset=True).items():
        setattr(client, key, value)

    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/{id}")
async def delete_client(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client)
        .options(selectinload(Client.wallet).selectinload(ClientWallet.transactions))
        .where(Client.id == id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check for active subscriptions
    sub_res = await db.execute(
        select(Subscription).where(Subscription.client_id == id, Subscription.status == "ACTIVE")
    )
    if sub_res.scalars().first():
        raise HTTPException(
            status_code=400, detail="Cannot delete client with active server subscriptions. Cancel subscriptions first."
        )

    if client.wallet:
        for tx in client.wallet.transactions:
            await db.delete(tx)
        await db.delete(client.wallet)

    await db.delete(client)
    await db.commit()
    return {"message": "Client deleted successfully", "id": id}
