import React, { useEffect, useState } from 'react';
import { clientService, bankService } from '../services/api';
import { Client, BankAccount } from '../types';
import { Modal } from '../components/common/Modal';
import { Plus, Wallet, Mail, Phone, ArrowDownRight } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Client form
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [initialDeposit, setInitialDeposit] = useState(0);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState(100);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [notes, setNotes] = useState('');

  const loadClients = () => {
    setLoading(true);
    Promise.all([clientService.list(), bankService.list()]).then(([cData, bData]) => {
      setClients(cData);
      setBanks(bData);
      if (bData.length > 0) setSelectedBankId(bData[0].id);
    }).finally(() => setLoading(false));
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
      loadClients();
    } catch (err) {
      alert('Error creating client');
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
        notes: notes || 'Manual wallet advance deposit',
      });
      setIsDepositModalOpen(false);
      setSelectedClient(null);
      loadClients();
    } catch (err) {
      alert('Error processing deposit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clients & Credit Wallets</h1>
          <p className="text-sm text-slate-400">Customer CRM, pre-funded wallet credits, and auto-debit management.</p>
        </div>
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {clients.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{c.company_name}</h3>
                  <div className="text-xs text-slate-400">Attn: {c.contact_name}</div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  {c.preferred_currency} {Number(c.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}</div>
                <div className="flex items-center gap-1.5 truncate"><Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone || 'N/A'}</div>
                {c.tax_id && <div>Tax ID: <span className="text-slate-200">{c.tax_id}</span></div>}
                <div>Preferred Currency: <b className="text-white">{c.preferred_currency}</b></div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Wallet Transactions: <b>{c.wallet?.transactions.length || 0}</b>
                </div>
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address</label>
            <input
              type="text"
              placeholder="123 Tech Parkway, Suite 400"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tax ID / VAT</label>
              <input
                type="text"
                placeholder="US-EIN-12345"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Advance Deposit</label>
              <input
                type="number"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Create Client & Activate Wallet
          </button>
        </form>
      </Modal>

      {/* Modal: Deposit */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Credit Client Wallet Balance">
        {selectedClient && (
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <div>Client: <b className="text-white">{selectedClient.company_name}</b></div>
              <div>Current Balance: <b className="text-purple-400">{selectedClient.preferred_currency} {selectedClient.wallet?.balance || 0}</b></div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Amount ({selectedClient.preferred_currency})</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Credited To Company Bank / Gateway</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.account_name} ({b.currency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Wire Reference</label>
              <input
                type="text"
                placeholder="e.g. Wire Ref #WIRE-99281"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
            >
              Confirm Deposit & Top-Up Wallet
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
