from pydantic import BaseModel


class BankBalanceSummary(BaseModel):
    id: str
    account_name: str
    bank_name: str
    currency: str
    balance: float
    balance_in_base: float


class RenewalAlert(BaseModel):
    id: str
    type: str  # SERVER_UPSTREAM, CLIENT_INVOICE, CLIENT_SUBSCRIPTION
    name: str
    due_date: str
    amount: float
    currency: str
    days_left: int


class AnalyticsSummary(BaseModel):
    base_currency: str
    mrr_base: float
    total_upstream_cost_base: float
    net_profit_base: float
    profit_margin_percentage: float
    total_servers: int
    available_servers: int
    assigned_servers: int
    total_clients: int
    total_bank_balance_base: float
    bank_balances: list[BankBalanceSummary]
    upcoming_renewals: list[RenewalAlert]
