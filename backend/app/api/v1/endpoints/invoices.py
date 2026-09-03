import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.client import Client
from app.models.financial import BankAccount
from app.models.invoice import Invoice, Payment
from app.models.server import Server
from app.models.subscription import Subscription
from app.schemas.invoice import (
    InvoiceResponse,
    PaymentCreate,
)
from app.services.billing_service import auto_debit_wallet_if_possible
from app.services.pdf_service import generate_invoice_pdf

router = APIRouter()


@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Invoice).options(selectinload(Invoice.payments)).order_by(Invoice.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{id}/pdf")
async def download_invoice_pdf(id: str, db: AsyncSession = Depends(get_db)):
    inv_res = await db.execute(select(Invoice).where(Invoice.id == id))
    invoice = inv_res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    client_res = await db.execute(select(Client).where(Client.id == invoice.client_id))
    client = client_res.scalar_one()

    bank = None
    if invoice.bank_account_id:
        bank_res = await db.execute(select(BankAccount).where(BankAccount.id == invoice.bank_account_id))
        bank = bank_res.scalar_one_or_none()

    sub, server = None, None
    if invoice.subscription_id:
        sub_res = await db.execute(select(Subscription).where(Subscription.id == invoice.subscription_id))
        sub = sub_res.scalar_one_or_none()
        if sub:
            server_res = await db.execute(select(Server).where(Server.id == sub.server_id))
            server = server_res.scalar_one_or_none()

    pdf_bytes = generate_invoice_pdf(invoice, client, bank, sub, server)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice.invoice_no}.pdf"'},
    )


@router.post("/{id}/pay", response_model=InvoiceResponse)
async def record_payment(id: str, req: PaymentCreate, db: AsyncSession = Depends(get_db)):
    inv_res = await db.execute(select(Invoice).options(selectinload(Invoice.payments)).where(Invoice.id == id))
    invoice = inv_res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        bank_account_id=req.bank_account_id,
        amount=req.amount,
        currency=req.currency,
        payment_method=req.payment_method,
        transaction_ref=req.transaction_ref,
        paid_at=req.paid_at or datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(payment)

    if req.bank_account_id:
        bank_res = await db.execute(select(BankAccount).where(BankAccount.id == req.bank_account_id))
        bank = bank_res.scalar_one_or_none()
        if bank:
            bank.current_balance = float(bank.current_balance) + req.amount

    invoice.status = "PAID"
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.post("/{id}/auto-debit")
async def auto_debit_invoice(id: str, db: AsyncSession = Depends(get_db)):
    success = await auto_debit_wallet_if_possible(db, id)
    if not success:
        raise HTTPException(status_code=400, detail="Auto-debit failed or insufficient client wallet balance")
    return {"status": "success", "message": "Invoice successfully settled from wallet"}
