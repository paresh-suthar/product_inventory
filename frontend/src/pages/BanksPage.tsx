import React, { useEffect, useState } from 'react';
import { bankService } from '../services/api';
import { BankAccount, AccountTransfer } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  CreditCard,
  Edit2,
  Trash2,
  History,
  TrendingDown
} from 'lucide-react';

export const BanksPage: React.FC = () => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [transfers, setTransfers] = useState<AccountTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'ACCOUNTS' | 'TRANSFERS'>('ACCOUNTS');

  const { convertValue } = useAppStore();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  // Add Bank Form
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'BANK' | 'GATEWAY'>('BANK');
  const [bankName, setBankName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState(0);
  const [accountNo, setAccountNo] = useState('');
  const [iban, setIban] = useState('');
  const [swiftBic, setSwiftBic] = useState('');

  // Edit Bank Form
  const [editAccountName, setEditAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNo, setEditAccountNo] = useState('');
  const [editIban, setEditIban] = useState('');
  const [editSwift, setEditSwift] = useState('');
  const [editBalance, setEditBalance] = useState(0);

  // Transfer Form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState(1000);
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([bankService.list(), bankService.listTransfers().catch(() => [])])
      .then(([bData, tData]) => {
        setBanks(bData);
        setTransfers(tData);
        if (bData.length >= 2) {
          if (!fromAccountId) setFromAccountId(bData[0].id);
          if (!toAccountId) setToAccountId(bData[1].id);
        }
      })
      .catch(() => showToast('Error loading financial accounts', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bankService.create({
        account_name: accountName,
        account_type: accountType,
        bank_name: bankName,
        currency,
        current_balance: Number(initialBalance),
        account_number: accountNo,
        iban,
        swift_bic: swiftBic,
      });
      setIsAddModalOpen(false);
      showToast(`Account ${accountName} created!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error creating bank account', 'error');
    }
  };

  const handleOpenEdit = (b: BankAccount) => {
    setSelectedBank(b);
    setEditAccountName(b.account_name);
    setEditBankName(b.bank_name);
    setEditAccountNo(b.account_number || '');
    setEditIban(b.iban || '');
    setEditSwift(b.swift_bic || '');
    setEditBalance(b.current_balance);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;
    try {
      await bankService.update(selectedBank.id, {
        account_name: editAccountName,
        bank_name: editBankName,
        account_number: editAccountNo,
        iban: editIban,
        swift_bic: editSwift,
        current_balance: Number(editBalance),
      });
      setIsEditModalOpen(false);
      showToast(`Account ${editAccountName} updated!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error updating account details', 'error');
    }
  };

  const handleDeleteBank = async (b: BankAccount) => {
    if (!window.confirm(`Are you sure you want to delete ${b.account_name}?`)) return;
    try {
      await bankService.delete(b.id);
      showToast(`Account ${b.account_name} deleted.`, 'info');
      loadData();
    } catch (err) {
      showToast('Error deleting bank account', 'error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      showToast('Source and destination accounts must be different', 'error');
      return;
    }
    try {
      await bankService.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount_sent: Number(transferAmount),
        notes: notes || 'Inter-account liquidity rebalancing',
      });
      setIsTransferModalOpen(false);
      showToast('Funds transferred & converted successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error processing transfer. Check source balance.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Corporate Banks & Payment Gateways</h1>
          <p className="text-sm text-slate-400">
            Multi-currency treasury ledger, digital gateway merchant pools, and inter-account FX transfers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            Transfer Funds
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveView('ACCOUNTS')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeView === 'ACCOUNTS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Active Corporate Accounts ({banks.length})
        </button>
        <button
          onClick={() => setActiveView('TRANSFERS')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeView === 'TRANSFERS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Inter-Account Transfer Ledger ({transfers.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading treasury balances...</div>
      ) : activeView === 'ACCOUNTS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((b) => {
            const converted = convertValue(b.current_balance, b.currency);
            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{b.account_name}</h3>
                    <div className="text-xs text-slate-400">{b.bank_name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={b.account_type} />
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBank(b)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400">Available Balance:</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    {b.currency} {b.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Converted: <b className="text-white">{converted.formatted}</b>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  {b.account_number && <div>Account No: <span className="text-slate-200 font-mono">{b.account_number}</span></div>}
                  {b.iban && <div>IBAN: <span className="text-slate-200 font-mono">{b.iban}</span></div>}
                  {b.swift_bic && <div>SWIFT / BIC: <span className="text-slate-200 font-mono">{b.swift_bic}</span></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Transfer Ledger Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Source Account</th>
                <th className="px-5 py-3.5">Destination Account</th>
                <th className="px-5 py-3.5">Amount Sent</th>
                <th className="px-5 py-3.5">Amount Received</th>
                <th className="px-5 py-3.5">Memo / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No inter-account transfers recorded yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {t.created_at ? t.created_at.split('T')[0] : 'Today'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      {t.from_account?.account_name || 'Source Account'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      {t.to_account?.account_name || 'Destination Account'}
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-400 font-mono">
                      -{t.from_account?.currency} {Number(t.amount_sent).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400 font-mono">
                      +{t.to_account?.currency} {Number(t.amount_received).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-slate-400 truncate max-w-xs">
                      {t.notes || 'Inter-account transfer'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Edit Bank Account */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Account Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Display Name</label>
            <input
              type="text"
              required
              value={editAccountName}
              onChange={(e) => setEditAccountName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bank / Gateway Name</label>
              <input
                type="text"
                required
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Adjust Current Balance</label>
              <input
                type="number"
                step="0.01"
                required
                value={editBalance}
                onChange={(e) => setEditBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                value={editAccountNo}
                onChange={(e) => setEditAccountNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">IBAN</label>
              <input
                type="text"
                value={editIban}
                onChange={(e) => setEditIban(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Account Details
          </button>
        </form>
      </Modal>

      {/* Modal: Add Bank */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Bank Account or Gateway">
        <form onSubmit={handleCreateBank} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Chase USD Business Operating"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="BANK">Bank Account (Wire/ACH)</option>
                <option value="GATEWAY">Digital Gateway (Stripe/PayPal/Wise)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Financial Institution</label>
              <input
                type="text"
                required
                placeholder="e.g. JPMorgan Chase"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Balance</label>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                placeholder="987654321"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">IBAN</label>
              <input
                type="text"
                placeholder="GB29..."
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">SWIFT / BIC Code</label>
            <input
              type="text"
              placeholder="CHASUS33"
              value={swiftBic}
              onChange={(e) => setSwiftBic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Account to Treasury
          </button>
        </form>
      </Modal>

      {/* Modal: Transfer Funds */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Inter-Account Liquidity Transfer">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">From Account (Source)</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.account_name} ({b.currency} {b.current_balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">To Account (Destination)</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.account_name} ({b.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Amount (in Source Currency)</label>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Memo / Reason</label>
            <input
              type="text"
              placeholder="e.g. Monthly gateway payout to bank account"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Execute Inter-Account Transfer
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BanksPage;
