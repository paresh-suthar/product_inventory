import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.financial import AccountTransfer, BankAccount
from app.schemas.financial import (
    AccountTransferCreate,
    AccountTransferResponse,
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
)
from app.services.fx_service import convert_currency

router = APIRouter()


@router.get("", response_model=list[BankAccountResponse])
async def list_bank_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BankAccount).order_by(BankAccount.created_at))
    return result.scalars().all()


@router.post("", response_model=BankAccountResponse)
async def create_bank_account(req: BankAccountCreate, db: AsyncSession = Depends(get_db)):
    account = BankAccount(**req.dict())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.put("/{id}", response_model=BankAccountResponse)
async def update_bank_account(id: str, req: BankAccountUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BankAccount).where(BankAccount.id == id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    for key, value in req.dict(exclude_unset=True).items():
        setattr(account, key, value)
    await db.commit()
    await db.refresh(account)
    return account


@router.post("/transfer", response_model=AccountTransferResponse)
async def transfer_between_accounts(req: AccountTransferCreate, db: AsyncSession = Depends(get_db)):
    from_acc_res = await db.execute(select(BankAccount).where(BankAccount.id == req.from_account_id))
    from_acc = from_acc_res.scalar_one_or_none()

    to_acc_res = await db.execute(select(BankAccount).where(BankAccount.id == req.to_account_id))
    to_acc = to_acc_res.scalar_one_or_none()

    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="One or both bank accounts not found")

    if float(from_acc.current_balance) < req.amount_sent:
        raise HTTPException(status_code=400, detail="Insufficient funds in source account")

    # Calculate converted amount in destination currency
    converted_amount = await convert_currency(db, req.amount_sent - req.fx_fee, from_acc.currency, to_acc.currency)

    # Update balances
    from_acc.current_balance = float(from_acc.current_balance) - req.amount_sent
    to_acc.current_balance = float(to_acc.current_balance) + converted_amount

    transfer = AccountTransfer(
        id=str(uuid.uuid4()),
        from_account_id=from_acc.id,
        to_account_id=to_acc.id,
        amount_sent=req.amount_sent,
        currency_sent=from_acc.currency,
        amount_received=converted_amount,
        currency_received=to_acc.currency,
        fx_fee=req.fx_fee or 0.0,
        notes=req.notes,
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)
    return transfer
