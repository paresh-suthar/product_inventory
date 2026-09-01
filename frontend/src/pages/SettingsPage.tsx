import React from 'react';
import { Shield, FileText } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400">Configure company metadata, tax rules, invoice templates, and administrator credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Company Profile & Invoicing
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400">Company Legal Name</label>
              <input defaultValue="StockFlow Cloud Infrastructure ERP" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400">Support / Billing Email</label>
              <input defaultValue="billing@stockflow.internal" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400">Default Payment Due Window</label>
              <input defaultValue="7 Days" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Security & Access
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400">Administrator Account</label>
              <input disabled defaultValue="admin@stockflow.internal" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400" />
            </div>
            <div>
              <label className="text-slate-400">API Version</label>
              <input disabled defaultValue="v1 (FastAPI 0.110.0)" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
