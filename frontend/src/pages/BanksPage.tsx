import React, { useEffect, useState } from 'react';
import { bankService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { BankAccount } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Plus, ArrowLeftRight } from 'lucide-react';

export const BanksPage: React.FC = () => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Bank Form
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'BANK' | 'GATEWAY'>('BANK');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState(0);

  // Transfer Form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState(1000);
  const [fxFee, setFxFee] = useState(10);
  const [transferNotes, setTransferNotes] = useState('');

  const { convertValue } = useAppStore();

  const loadBanks = () => {
    setLoading(true);
    bankService.list().then((data) => {
      setBanks(data);
      if (data.length >= 2) {
        setFromAccountId(data[0].id);
        setToAccountId(data[1].id);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bankService.create({
        account_name: accountName,
        account_type: accountType,
        bank_name: bankName,
        account_number: accountNo,
        iban,
        swift_bic: swift,
        currency,
        current_balance: Number(initialBalance),
      });
      setIsAddModalOpen(false);
      loadBanks();
    } catch (err) {
      alert('Error creating bank account');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different');
      return;
    }
    try {
      await bankService.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount_sent: Number(transferAmount),
        fx_fee: Number(fxFee),
        notes: transferNotes || 'Internal inter-account treasury transfer',
      });
      setIsTransferModalOpen(false);
      loadBanks();
    } catch (err) {
      alert('Error processing transfer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Corporate Banks & Payment Gateways</h1>
          <p className="text-sm text-slate-400">Manage multi-currency business accounts, Stripe/PayPal gateways, and treasury transfers.</p>
        </div>
        <div className="flex items-center gap-3">
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

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading financial accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((b) => {
            const converted = convertValue(b.current_balance, b.currency);
            return (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{b.account_name}</h3>
                    <div className="text-xs text-slate-400">{b.bank_name}</div>
                  </div>
                  <StatusBadge status={b.account_type} />
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
      )}

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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
              value={swift}
              onChange={(e) => setSwift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Account
          </button>
        </form>
      </Modal>

      {/* Modal: Transfer */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Inter-Account Treasury Transfer">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">From Account (Source)</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.account_name} ({b.currency} {b.current_balance.toFixed(2)})</option>
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
                  <option key={b.id} value={b.id}>{b.account_name} ({b.currency})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Amount (in source currency)</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">FX / Conversion Fee</label>
              <input
                type="number"
                step="0.01"
                value={fxFee}
                onChange={(e) => setFxFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Notes</label>
            <input
              type="text"
              placeholder="e.g. Rebalance USD operating liquidity"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
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
