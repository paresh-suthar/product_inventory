import asyncio
import uuid
import time
from datetime import datetime, timezone, timedelta
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.financial import Currency, BankAccount
from app.models.provider import Provider
from app.models.server import Server, IPAddress
from app.models.client import Client, ClientWallet, WalletTransaction
from app.models.subscription import Subscription
from app.models.invoice import Invoice, Payment

async def wait_for_db(retries=15, delay=2):
    for i in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Connected to database and verified schema.")
            return
        except Exception as e:
            print(f"Waiting for database to become ready... ({i+1}/{retries}) - {e}")
            await asyncio.sleep(delay)
    raise RuntimeError("Could not connect to database after multiple retries.")

async def seed_data():
    await wait_for_db()
        
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        existing_user = await session.execute(select(User).where(User.email == 'admin@stockflow.internal'))
        if existing_user.scalar_one_or_none():
            print('Database already seeded.')
            return

        print('Seeding database with initial currencies, bank accounts, servers, and clients...')
        
        # 1. Admin User
        admin = User(
            id=str(uuid.uuid4()),
            email='admin@stockflow.internal',
            full_name='System Administrator',
            hashed_password=get_password_hash('admin123'),
            role='ADMIN',
            is_active=True
        )
        session.add(admin)
        
        # 2. Currencies (USD as base)
        currencies = [
            Currency(id=str(uuid.uuid4()), code='USD', name='US Dollar', symbol='$', exchange_rate_to_base=1.0, is_base=True),
            Currency(id=str(uuid.uuid4()), code='EUR', name='Euro', symbol='€', exchange_rate_to_base=0.92, is_base=False),
            Currency(id=str(uuid.uuid4()), code='INR', name='Indian Rupee', symbol='₹', exchange_rate_to_base=83.50, is_base=False),
            Currency(id=str(uuid.uuid4()), code='AED', name='UAE Dirham', symbol='د.إ', exchange_rate_to_base=3.67, is_base=False),
            Currency(id=str(uuid.uuid4()), code='GBP', name='British Pound', symbol='£', exchange_rate_to_base=0.79, is_base=False),
            Currency(id=str(uuid.uuid4()), code='SAR', name='Saudi Riyal', symbol='﷼', exchange_rate_to_base=3.75, is_base=False),
        ]
        for c in currencies:
            session.add(c)
            
        # 3. Company Bank Accounts & Gateways
        chase = BankAccount(
            id=str(uuid.uuid4()),
            account_name='Chase USD Corporate Operating',
            account_type='BANK',
            bank_name='JPMorgan Chase Bank, N.A.',
            account_number='9876543210',
            routing_code='021000021',
            swift_bic='CHASUS33',
            currency='USD',
            current_balance=45200.00
        )
        barclays = BankAccount(
            id=str(uuid.uuid4()),
            account_name='Barclays UK Sterling Account',
            account_type='BANK',
            bank_name='Barclays Bank PLC',
            account_number='44556677',
            iban='GB29BARC20000044556677',
            swift_bic='BARCGB22',
            currency='GBP',
            current_balance=18500.00
        )
        hdfc = BankAccount(
            id=str(uuid.uuid4()),
            account_name='HDFC India Current Account',
            account_type='BANK',
            bank_name='HDFC Bank Ltd',
            account_number='50200012345678',
            routing_code='HDFC0000123',
            currency='INR',
            current_balance=1250000.00
        )
        wise = BankAccount(
            id=str(uuid.uuid4()),
            account_name='Wise Multi-Currency EUR Balance',
            account_type='GATEWAY',
            bank_name='Wise Payments Ltd',
            iban='BE12345678901234',
            swift_bic='TRWIBEB1',
            currency='EUR',
            current_balance=24800.00
        )
        stripe = BankAccount(
            id=str(uuid.uuid4()),
            account_name='Stripe USD Merchant Gateway',
            account_type='GATEWAY',
            bank_name='Stripe Payments',
            currency='USD',
            current_balance=8950.00
        )
        session.add_all([chase, barclays, hdfc, wise, stripe])
        
        # 4. Upstream Providers
        hetzner = Provider(
            id=str(uuid.uuid4()),
            name='Hetzner Online GmbH',
            contact_email='support@hetzner.com',
            portal_url='https://robot.hetzner.com',
            account_number='HTZ-99482',
            currency='EUR',
            support_phone='+49 9831 505-0'
        )
        ovh = Provider(
            id=str(uuid.uuid4()),
            name='OVHcloud Group',
            contact_email='sales@ovhcloud.com',
            portal_url='https://ca.ovh.com/manager',
            account_number='OVH-88319',
            currency='EUR',
            support_phone='+33 9 72 10 10 07'
        )
        aws = Provider(
            id=str(uuid.uuid4()),
            name='Amazon Web Services (AWS)',
            contact_email='aws-billing@amazon.com',
            portal_url='https://console.aws.amazon.com',
            account_number='AWS-112233445566',
            currency='USD'
        )
        session.add_all([hetzner, ovh, aws])
        
        # 5. Servers (Dedicated Hardware)
        srv1_id = str(uuid.uuid4())
        srv1 = Server(
            id=srv1_id,
            hostname='de-fs-epyc-01.stockflow.net',
            provider_id=hetzner.id,
            datacenter_location='Falkenstein (DE) - DC 10',
            rack_node_id='RACK-A4-U12',
            cpu='AMD EPYC 7702 (64 Cores / 128 Threads)',
            ram_gb=128,
            storage='2x 1.92TB NVMe SSD Datacenter',
            bandwidth='1 Gbps Guaranteed Unmetered',
            primary_ip='136.243.104.12',
            upstream_cost=119.00,
            upstream_currency='EUR',
            provider_renewal_day=5,
            status='ASSIGNED'
        )
        ip1 = IPAddress(id=str(uuid.uuid4()), server_id=srv1_id, ip_address='136.243.104.12', is_primary=True, status='ASSIGNED')
        ip2 = IPAddress(id=str(uuid.uuid4()), server_id=srv1_id, ip_address='136.243.104.13', is_primary=False, status='ASSIGNED')
        
        srv2_id = str(uuid.uuid4())
        srv2 = Server(
            id=srv2_id,
            hostname='us-or-xeon-02.stockflow.net',
            provider_id=ovh.id,
            datacenter_location='Hillsboro, Oregon (US)',
            rack_node_id='RACK-B2-U08',
            cpu='Intel Xeon E-2276G (6 Cores / 12 Threads)',
            ram_gb=64,
            storage='2x 960GB NVMe SSD Soft RAID',
            bandwidth='1 Gbps Port with 50TB Bandwidth',
            primary_ip='51.222.14.88',
            upstream_cost=89.00,
            upstream_currency='EUR',
            provider_renewal_day=12,
            status='AVAILABLE'
        )
        ip3 = IPAddress(id=str(uuid.uuid4()), server_id=srv2_id, ip_address='51.222.14.88', is_primary=True, status='AVAILABLE')

        srv3_id = str(uuid.uuid4())
        srv3 = Server(
            id=srv3_id,
            hostname='sg-sin-gpu-03.stockflow.net',
            provider_id=aws.id,
            datacenter_location='Singapore (ap-southeast-1)',
            rack_node_id='AWS-EC2-G4DN',
            cpu='Intel Xeon Scalable + NVIDIA T4 GPU',
            ram_gb=64,
            storage='1x 500GB NVMe Root + 1TB EBS',
            bandwidth='5 Gbps Burst Network',
            primary_ip='18.139.22.45',
            upstream_cost=245.00,
            upstream_currency='USD',
            provider_renewal_day=18,
            status='ASSIGNED'
        )
        ip4 = IPAddress(id=str(uuid.uuid4()), server_id=srv3_id, ip_address='18.139.22.45', is_primary=True, status='ASSIGNED')
        
        srv4_id = str(uuid.uuid4())
        srv4 = Server(
            id=srv4_id,
            hostname='fi-hel-ryzen-04.stockflow.net',
            provider_id=hetzner.id,
            datacenter_location='Helsinki (FI) - DC 01',
            rack_node_id='RACK-C1-U04',
            cpu='AMD Ryzen 9 5950X (16 Cores / 32 Threads)',
            ram_gb=128,
            storage='2x 3.84TB Enterprise NVMe',
            bandwidth='1 Gbps Port Unmetered',
            primary_ip='65.21.88.90',
            upstream_cost=94.00,
            upstream_currency='EUR',
            provider_renewal_day=22,
            status='AVAILABLE'
        )
        ip5 = IPAddress(id=str(uuid.uuid4()), server_id=srv4_id, ip_address='65.21.88.90', is_primary=True, status='AVAILABLE')
        
        session.add_all([srv1, ip1, ip2, srv2, ip3, srv3, ip4, srv4, ip5])
        
        # 6. Clients & Wallets
        client1_id = str(uuid.uuid4())
        client1 = Client(
            id=client1_id,
            company_name='Apex Financial Analytics LLC',
            contact_name='David Vance',
            email='david@apexfinancial.com',
            phone='+1 (415) 890-1122',
            billing_address='555 California St, Suite 300, San Francisco, CA 94104',
            tax_id='US-EIN-88492019',
            preferred_currency='USD'
        )
        wallet1_id = str(uuid.uuid4())
        wallet1 = ClientWallet(
            id=wallet1_id,
            client_id=client1_id,
            currency='USD',
            balance=650.00
        )
        tx1 = WalletTransaction(
            id=str(uuid.uuid4()),
            wallet_id=wallet1_id,
            amount=650.00,
            currency='USD',
            transaction_type='DEPOSIT',
            notes='Initial advance wire transfer deposit'
        )
        
        client2_id = str(uuid.uuid4())
        client2 = Client(
            id=client2_id,
            company_name='CloudMatrix Systems Ltd',
            contact_name='Sarah Jenkins',
            email='sarah@cloudmatrix.co.uk',
            phone='+44 20 7946 0991',
            billing_address='10 Finsbury Square, London EC2A 1AF, UK',
            tax_id='GB-VAT-9928172',
            preferred_currency='GBP'
        )
        wallet2_id = str(uuid.uuid4())
        wallet2 = ClientWallet(
            id=wallet2_id,
            client_id=client2_id,
            currency='GBP',
            balance=200.00
        )
        
        session.add_all([client1, wallet1, tx1, client2, wallet2])
        
        # 7. Subscriptions (Server Allocations)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        sub1_id = str(uuid.uuid4())
        sub1 = Subscription(
            id=sub1_id,
            client_id=client1_id,
            server_id=srv1_id,
            plan_name='Dedicated AMD EPYC 64-Core High-Compute Plan',
            selling_price=249.00,
            currency='USD',
            billing_cycle='MONTHLY',
            start_date=now - timedelta(days=20),
            next_due_date=now + timedelta(days=10),
            status='ACTIVE',
            auto_renew_from_wallet='YES'
        )
        
        sub2_id = str(uuid.uuid4())
        sub2 = Subscription(
            id=sub2_id,
            client_id=client2_id,
            server_id=srv3_id,
            plan_name='Cloud GPU AI Inference Node',
            selling_price=399.00,
            currency='USD',
            billing_cycle='MONTHLY',
            start_date=now - timedelta(days=15),
            next_due_date=now + timedelta(days=15),
            status='ACTIVE',
            auto_renew_from_wallet='YES'
        )
        session.add_all([sub1, sub2])
        
        # 8. Sample Invoices
        inv1 = Invoice(
            id=str(uuid.uuid4()),
            invoice_no='INV-2026-1001',
            subscription_id=sub1_id,
            client_id=client1_id,
            bank_account_id=chase.id,
            subtotal=249.00,
            tax_amount=0.0,
            total_amount=249.00,
            currency='USD',
            issue_date=now - timedelta(days=20),
            due_date=now - timedelta(days=13),
            status='PAID',
            notes='Dedicated AMD EPYC Plan - Month 1'
        )
        pay1 = Payment(
            id=str(uuid.uuid4()),
            invoice_id=inv1.id,
            bank_account_id=chase.id,
            amount=249.00,
            currency='USD',
            payment_method='CLIENT_WALLET',
            transaction_ref='TX-WAL-AUTO-1001',
            paid_at=now - timedelta(days=20)
        )
        
        inv2 = Invoice(
            id=str(uuid.uuid4()),
            invoice_no='INV-2026-1002',
            subscription_id=sub2_id,
            client_id=client2_id,
            bank_account_id=barclays.id,
            subtotal=399.00,
            tax_amount=0.0,
            total_amount=399.00,
            currency='USD',
            issue_date=now - timedelta(days=2),
            due_date=now + timedelta(days=5),
            status='UNPAID',
            notes='Cloud GPU AI Inference Node - Month 1'
        )
        session.add_all([inv1, pay1, inv2])
        
        await session.commit()
        print('Database successfully seeded with realistic enterprise data!')

if __name__ == '__main__':
    asyncio.run(seed_data())
