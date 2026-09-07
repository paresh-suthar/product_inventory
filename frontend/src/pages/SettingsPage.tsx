import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  FileText,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Database,
  Lock,
  Globe
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState('StockFlow Cloud Infrastructure ERP');
  const [billingEmail, setBillingEmail] = useState('billing@stockflow.internal');
  const [dueDays, setDueDays] = useState(7);
  const [taxRate, setTaxRate] = useState(0.0);
  const [invoiceNotes, setInvoiceNotes] = useState('Thank you for choosing StockFlow for your mission-critical bare-metal servers.');
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('stockflow_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.billingEmail) setBillingEmail(parsed.billingEmail);
        if (parsed.dueDays) setDueDays(parsed.dueDays);
        if (parsed.taxRate !== undefined) setTaxRate(parsed.taxRate);
        if (parsed.invoiceNotes) setInvoiceNotes(parsed.invoiceNotes);
        if (parsed.autoDebitEnabled !== undefined) setAutoDebitEnabled(parsed.autoDebitEnabled);
        if (parsed.lowBalanceThreshold) setLowBalanceThreshold(parsed.lowBalanceThreshold);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const payload = {
        companyName,
        billingEmail,
        dueDays,
        taxRate,
        invoiceNotes,
        autoDebitEnabled,
        lowBalanceThreshold,
      };
      localStorage.setItem('stockflow_settings', JSON.stringify(payload));
      setIsSaving(false);
      showToast('Enterprise platform settings saved successfully!', 'success');
    }, 400);
  };

  const handleClearCache = () => {
    localStorage.removeItem('stockflow_settings');
    showToast('Application local cache reset to factory defaults', 'info');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Organization Settings</h1>
          <p className="text-sm text-slate-400">
            Configure company branding, billing automation rules, and ERP security policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearCache}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile & Invoicing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Organization & PDF Invoicing
          </h3>
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company Registered Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Support / Billing Department Email</label>
              <input
                type="email"
                required
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Window (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Invoice Footer Disclaimer / Memo</label>
              <textarea
                rows={3}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Automation & Wallet Rules */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Wallet & Auto-Debit Rules
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Automated Wallet Auto-Debit</div>
                  <div className="text-slate-400 text-[11px]">
                    Auto-charge client credit balances on server renewal due dates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoDebitEnabled}
                  onChange={(e) => setAutoDebitEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Low Balance Alert Threshold ($ USD)</label>
                <input
                  type="number"
                  value={lowBalanceThreshold}
                  onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Triggers email notification when client balance drops below this amount.
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure & Database Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security & Environment Status
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-mono text-white font-semibold">PostgreSQL 16 (AsyncPG)</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">JWT Token Standard:</span>
                <span className="font-mono text-emerald-400 font-semibold">PyJWT 2.8+ (HS256)</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Master Base Currency:</span>
                <span className="font-mono text-blue-400 font-semibold">USD ($)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SettingsPage;
