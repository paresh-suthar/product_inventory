import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, ClientWallet, WalletTransaction
from app.models.financial import BankAccount
from app.models.invoice import Invoice, Payment
from app.models.subscription import Subscription


async def generate_subscription_invoice(session: AsyncSession, subscription_id: str) -> Invoice:
    sub_res = await session.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = sub_res.scalar_one_or_none()
    if not sub:
        raise ValueError("Subscription not found")

    client_res = await session.execute(select(Client).where(Client.id == sub.client_id))
    client = client_res.scalar_one()

    # Auto-find suitable bank account matching currency
    bank_res = await session.execute(
        select(BankAccount).where(BankAccount.currency == sub.currency, BankAccount.is_active == True)
    )
    bank = bank_res.scalars().first()

    now = datetime.now(timezone.utc).replace(tzinfo=None).replace(tzinfo=None)
    inv_count_res = await session.execute(select(Invoice))
    inv_num = len(inv_count_res.scalars().all()) + 1001

    invoice = Invoice(
        id=str(uuid.uuid4()),
        invoice_no=f"INV-2026-{inv_num}",
        subscription_id=sub.id,
        client_id=client.id,
        bank_account_id=bank.id if bank else None,
        subtotal=sub.selling_price,
        tax_amount=0.0,
        total_amount=sub.selling_price,
        currency=sub.currency,
        issue_date=now,
        due_date=now + timedelta(days=7),
        status="UNPAID",
        notes=f"Recurring billing for {sub.plan_name}",
    )
    session.add(invoice)
    await session.commit()
    await session.refresh(invoice)
    return invoice


async def auto_debit_wallet_if_possible(session: AsyncSession, invoice_id: str) -> bool:
    inv_res = await session.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = inv_res.scalar_one_or_none()
    if not invoice or invoice.status == "PAID":
        return False

    wallet_res = await session.execute(select(ClientWallet).where(ClientWallet.client_id == invoice.client_id))
    wallet = wallet_res.scalar_one_or_none()

    if wallet and float(wallet.balance) >= float(invoice.total_amount):
        # Deduct wallet balance
        wallet.balance = float(wallet.balance) - float(invoice.total_amount)
        tx = WalletTransaction(
            id=str(uuid.uuid4()),
            wallet_id=wallet.id,
            amount=-float(invoice.total_amount),
            currency=invoice.currency,
            transaction_type="RENEWAL_DEBIT",
            reference_id=invoice.invoice_no,
            notes=f"Auto-debit for {invoice.invoice_no}",
        )
        session.add(tx)

        # Mark invoice paid
        invoice.status = "PAID"
        payment = Payment(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            amount=invoice.total_amount,
            currency=invoice.currency,
            payment_method="CLIENT_WALLET",
            transaction_ref=tx.id,
            paid_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        session.add(payment)
        await session.commit()
        return True
    return False
