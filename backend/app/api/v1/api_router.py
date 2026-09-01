from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, currencies, bank_accounts, providers, servers, clients, subscriptions, invoices, analytics
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix='/auth', tags=['Authentication'])
api_router.include_router(currencies.router, prefix='/currencies', tags=['Currencies'])
api_router.include_router(bank_accounts.router, prefix='/banks', tags=['Bank & Gateway Accounts'])
api_router.include_router(providers.router, prefix='/providers', tags=['Upstream Providers'])
api_router.include_router(servers.router, prefix='/servers', tags=['Server Inventory & IPAM'])
api_router.include_router(clients.router, prefix='/clients', tags=['Clients & Wallets'])
api_router.include_router(subscriptions.router, prefix='/subscriptions', tags=['Subscriptions & Allocations'])
api_router.include_router(invoices.router, prefix='/invoices', tags=['Invoices & Payments'])
api_router.include_router(analytics.router, prefix='/analytics', tags=['Analytics & Dashboard'])
