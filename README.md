# StockFlow: Server Inventory, Multi-Bank & Multi-Currency ERP

A modern, full-stack enterprise web application designed for **Server & Cloud Infrastructure Inventory, Upstream Provider Procurement, Client Subscriptions & Provisioning, Multiple Corporate Bank Accounts, and Global Multi-Currency Financial Management**.

---

## 🚀 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zustand
- **Backend**: FastAPI (Python 3.11+), Async SQLAlchemy 2.0, Pydantic v2, ReportLab (PDF Invoices)
- **Database**: PostgreSQL 16 (with SQLite async fallback for rapid standalone local testing)

---

## 📦 Core Features
1. **🖥️ Server & Resource Inventory (IPAM)**:
   - Dedicated servers, VPS nodes, Cloud instances, GPU compute servers.
   - Hardware specs: CPU model/cores, RAM, NVMe/SSD storage, port speed, Datacenter / Region location.
   - IP Address Pool: Primary IPv4/IPv6, secondary subnet blocks.
   - Statuses: `AVAILABLE`, `ASSIGNED`, `MAINTENANCE`, `TERMINATED`.

2. **🛒 Upstream Provider Procurement**:
   - Provider directory (Hetzner, OVH, AWS, Leaseweb, Equinix).
   - Track monthly/annual upstream costs in provider native currency (EUR, USD).
   - Provider contract renewal calendar and deadline alerts.

3. **🏦 Multi-Bank & Payment Gateway Management**:
   - Multiple company bank accounts (USD, EUR, INR, AED, GBP) with IBAN, SWIFT/BIC, and live balances.
   - Digital payment gateways (Stripe, PayPal, Wise, Payoneer).
   - Dynamic invoice bank routing (displays matching bank wire details on invoices).
   - Inter-account fund transfers with FX fee tracking.

4. **💱 Global Multi-Currency & FX Engine**:
   - Master Base Reporting Currency (e.g. USD).
   - Supported fiat currencies (USD, EUR, INR, GBP, AED, SAR) with live/manual exchange rates.
   - Real-time conversion of all revenues, costs, and bank balances to base currency.

5. **👥 Clients, Subscriptions & Credit Wallets**:
   - Client CRM with contact info, tax IDs, and preferred billing currency.
   - **Client Pre-Funded Wallet**: Advance deposit support + automated auto-debit on renewal due date.
   - Server allocations with flexible billing cycles (Monthly, Quarterly, Annual).
   - In-browser downloadable, branded PDF Tax Invoices.

6. **📊 Profit & Cash Flow Analytics**:
   - Monthly Recurring Revenue (MRR) vs. Total Upstream Infrastructure Spend.
   - Net Profit Margin % per server: `(Selling Price - Upstream Cost)`.
   - Live cash balances across all corporate bank accounts and payment gateways.
   - 7, 14, and 30-day renewal deadline radar.

---

## 🛠️ Local Development Setup

### 1. Backend Setup:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed initial database with sample currencies, banks, servers, and clients
python -m app.seed

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Interactive Swagger Docs**: http://localhost:8000/api/v1/docs

---

## 🔑 Default Admin Credentials (Pre-seeded)
- **Email**: `admin@stockflow.internal`
- **Password**: `admin123`
