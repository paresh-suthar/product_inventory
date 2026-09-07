import React, { useEffect, useState } from 'react';
import { clientService, bankService } from '../services/api';
import { Client, BankAccount, Subscription } from '../types';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  Plus,
  Wallet,
  Mail,
  Phone,
  ArrowDownRight,
  Search,
  Edit2,
  Trash2,
  Server as ServerIcon,
  ReceiptText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { showToast } = useToast();

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSubscriptions, setClientSubscriptions] = useState<Subscription[]>([]);

  // Client form
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [initialDeposit, setInitialDeposit] = useState(0);

  // Edit form
  const [editCompany, setEditCompany] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTaxId, setEditTaxId] = useState('');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState(250);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [notes, setNotes] = useState('');

  // Details tab state
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'SERVERS'>('LEDGER');

  const loadClients = () => {
    setLoading(true);
    Promise.all([clientService.list(), bankService.list()])
      .then(([cData, bData]) => {
        setClients(cData);
        setBanks(bData);
        if (bData.length > 0 && !selectedBankId) setSelectedBankId(bData[0].id);
      })
      .catch(() => showToast('Error fetching clients', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientService.create({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        billing_address: address,
        tax_id: taxId,
        preferred_currency: preferredCurrency,
        initial_wallet_deposit: Number(initialDeposit),
      });
      setIsClientModalOpen(false);
      showToast(`Client ${companyName} onboarded successfully!`, 'success');
      loadClients();
    } catch (err) {
      showToast('Error creating client profile', 'error');
    }
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setEditCompany(client.company_name);
    setEditContact(client.contact_name);
    setEditEmail(client.email);
    setEditPhone(client.phone || '');
    setEditAddress(client.billing_address || '');
    setEditTaxId(client.tax_id || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await clientService.update(selectedClient.id, {
        company_name: editCompany,
        contact_name: editContact,
        email: editEmail,
        phone: editPhone,
        billing_address: editAddress,
        tax_id: editTaxId,
      });
      setIsEditModalOpen(false);
      showToast(`Client details updated!`, 'success');
      loadClients();
    } catch (err) {
      showToast('Error updating client', 'error');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to delete client "${client.company_name}"?`)) {
      return;
    }
    try {
      await clientService.delete(client.id);
      showToast(`Client ${client.company_name} deleted.`, 'info');
      loadClients();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Cannot delete client with active server subscriptions', 'error');
    }
  };

  const handleOpenDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
    try {
      const res = await clientService.get(client.id);
      setClientSubscriptions(res.subscriptions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await clientService.depositWallet(selectedClient.id, {
        amount: Number(depositAmount),
        currency: selectedClient.preferred_currency,
        bank_account_id: selectedBankId,
        notes: notes || 'Pre-funded wallet advance deposit',
      });
      setIsDepositModalOpen(false);
      showToast(`Deposited ${selectedClient.preferred_currency} ${depositAmount} into client wallet!`, 'success');
      setSelectedClient(null);
      loadClients();
    } catch (err) {
      showToast('Error processing wallet deposit', 'error');
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.contact_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & New Client */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clients & Pre-Funded Wallets</h1>
          <p className="text-sm text-slate-400">
            Client accounts, automated credit renewals, and multi-currency wallet ledger tracking.
          </p>
        </div>
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Onboard Client
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search client by name, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading client accounts...</div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClients.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
            >
              {/* Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => handleOpenDetails(c)}
                    className="font-bold text-white text-base hover:text-blue-400 transition text-left"
                  >
                    {c.company_name}
                  </button>
                  <div className="text-xs text-slate-400">Attn: {c.contact_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    {c.preferred_currency} {Number(c.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                    title="Delete client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone || 'N/A'}
                </div>
                {c.tax_id && <div>Tax ID: <span className="text-slate-200 font-mono">{c.tax_id}</span></div>}
                <div>Preferred Currency: <b className="text-white">{c.preferred_currency}</b></div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenDetails(c)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  View Ledger & Servers ({c.wallet?.transactions.length || 0} events) &rarr;
                </button>
                <button
                  onClick={() => {
                    setSelectedClient(c);
                    setIsDepositModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Deposit Funds
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Client Profile & Ledger History Drawer */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedClient ? `${selectedClient.company_name} — Account Center` : 'Client Details'}
      >
        {selectedClient && (
          <div className="space-y-4">
            {/* Wallet Quick Balance Card */}
            <div className="p-4 bg-purple-950/40 border border-purple-800/50 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-purple-300 font-medium">Available Credit Balance</div>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {selectedClient.preferred_currency} {Number(selectedClient.wallet?.balance || 0).toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsDepositModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
              >
                + Top Up Wallet
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('LEDGER')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'LEDGER'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Wallet Transaction Ledger ({selectedClient.wallet?.transactions.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('SERVERS')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'SERVERS'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Active Subscriptions ({clientSubscriptions.length})
              </button>
            </div>

            {/* Tab 1: Ledger History */}
            {activeTab === 'LEDGER' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedClient.wallet?.transactions && selectedClient.wallet.transactions.length > 0 ? (
                  selectedClient.wallet.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {tx.transaction_type === 'DEPOSIT' ? (
                            <span className="text-emerald-400 font-bold">+ DEPOSIT</span>
                          ) : (
                            <span className="text-amber-400 font-bold">- AUTO DEBIT</span>
                          )}
                          <span className="text-slate-400">&bull; {tx.notes || 'Wallet balance adjustment'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {tx.created_at ? tx.created_at.replace('T', ' ').split('.')[0] : 'Recorded'}
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${tx.transaction_type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.transaction_type === 'DEPOSIT' ? '+' : '-'}{selectedClient.preferred_currency} {Number(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">No transactions recorded yet.</div>
                )}
              </div>
            )}

            {/* Tab 2: Servers / Subscriptions */}
            {activeTab === 'SERVERS' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {clientSubscriptions.length > 0 ? (
                  clientSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <ServerIcon className="w-3.5 h-3.5 text-blue-400" />
                          {sub.plan_name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Renews: <span className="text-amber-400 font-semibold">{sub.next_due_date.split('T')[0]}</span> &bull; Cycle: {sub.billing_cycle}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {sub.currency} {sub.selling_price.toFixed(2)}/mo
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">No active servers allocated to this client.</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Edit Client Profile */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Client Profile">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization</label>
            <input
              type="text"
              required
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Contact</label>
              <input
                type="text"
                required
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tax ID / VAT No.</label>
              <input
                type="text"
                value={editTaxId}
                onChange={(e) => setEditTaxId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Client Profile
          </button>
        </form>
      </Modal>

      {/* Modal: Create Client */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Onboard New Client">
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. HyperScale Media Group"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Contact Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="john@hyperscale.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 555 0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tax ID / VAT Registration</label>
              <input
                type="text"
                placeholder="e.g. US-EIN-992144"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Opening Wallet Credit</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Billing Address</label>
            <input
              type="text"
              placeholder="e.g. 500 Terry Francois Blvd, San Francisco, CA 94158"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Create Client & Credit Wallet
          </button>
        </form>
      </Modal>

      {/* Modal: Deposit to Wallet */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Pre-Fund Client Wallet">
        {selectedClient && (
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <div>Client: <b className="text-white">{selectedClient.company_name}</b></div>
              <div>Current Balance: <b className="text-purple-400">{selectedClient.preferred_currency} {Number(selectedClient.wallet?.balance || 0).toFixed(2)}</b></div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deposit Amount ({selectedClient.preferred_currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Receiving Bank Account</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.account_name} ({b.bank_name} - {b.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Reference / Memo</label>
              <input
                type="text"
                placeholder="e.g. Wire Ref #WT-992014 or Stripe charge"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
            >
              Credit Client Wallet Now
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClientsPage;
