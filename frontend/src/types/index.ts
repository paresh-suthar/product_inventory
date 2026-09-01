export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_base: number;
  is_base: boolean;
}

export interface BankAccount {
  id: string;
  account_name: string;
  account_type: 'BANK' | 'GATEWAY';
  bank_name: string;
  account_number?: string;
  iban?: string;
  swift_bic?: string;
  routing_code?: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  contact_email?: string;
  portal_url?: string;
  account_number?: string;
  currency: string;
  support_phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface IPAddress {
  id: string;
  server_id?: string;
  ip_address: string;
  subnet_mask: string;
  gateway?: string;
  is_primary: boolean;
  status: string;
}

export interface Server {
  id: string;
  hostname: string;
  provider_id: string;
  datacenter_location: string;
  rack_node_id?: string;
  cpu: string;
  ram_gb: number;
  storage: string;
  bandwidth: string;
  primary_ip: string;
  upstream_cost: number;
  upstream_currency: string;
  provider_renewal_day: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'TERMINATED';
  notes?: string;
  created_at: string;
  ip_addresses: IPAddress[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface ClientWallet {
  id: string;
  currency: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  billing_address?: string;
  tax_id?: string;
  preferred_currency: string;
  is_active: boolean;
  created_at: string;
  wallet?: ClientWallet;
}

export interface Subscription {
  id: string;
  client_id: string;
  server_id: string;
  plan_name: string;
  selling_price: number;
  currency: string;
  billing_cycle: string;
  start_date: string;
  next_due_date: string;
  status: string;
  auto_renew_from_wallet: string;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  bank_account_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_ref?: string;
  paid_at: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  subscription_id?: string;
  client_id: string;
  bank_account_id?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  created_at: string;
  payments: Payment[];
}

export interface AnalyticsSummary {
  base_currency: string;
  mrr_base: number;
  total_upstream_cost_base: number;
  net_profit_base: number;
  profit_margin_percentage: number;
  total_servers: number;
  available_servers: number;
  assigned_servers: number;
  total_clients: number;
  total_bank_balance_base: number;
  bank_balances: {
    id: string;
    account_name: string;
    bank_name: string;
    currency: string;
    balance: number;
    balance_in_base: number;
  }[];
  upcoming_renewals: {
    id: string;
    type: string;
    name: string;
    due_date: string;
    amount: number;
    currency: string;
    days_left: number;
  }[];
}
