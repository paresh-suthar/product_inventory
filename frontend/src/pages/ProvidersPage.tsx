import React, { useEffect, useState } from 'react';
import { providerService } from '../services/api';
import { Provider } from '../types';
import { Modal } from '../components/common/Modal';
import { Building2, Plus, Globe, Mail, Phone } from 'lucide-react';

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [phone, setPhone] = useState('');

  const loadProviders = () => {
    setLoading(true);
    providerService.list()
      .then(setProviders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await providerService.create({
        name,
        contact_email: email,
        portal_url: url,
        account_number: accountNo,
        currency,
        support_phone: phone,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setUrl('');
      loadProviders();
    } catch (err) {
      alert('Error creating provider');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Upstream Hardware Providers</h1>
          <p className="text-sm text-slate-400">Manage data center vendors and infrastructure supplier accounts.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading providers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <div className="text-xs text-slate-400">Billing Currency: <b className="text-white">{p.currency}</b></div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                {p.account_number && <div>Account ID: <span className="text-slate-200 font-mono">{p.account_number}</span></div>}
                {p.contact_email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {p.contact_email}</div>}
                {p.support_phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {p.support_phone}</div>}
                {p.portal_url && (
                  <div className="pt-2">
                    <a
                      href={p.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" /> Launch Provider Console
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Upstream Provider">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Provider Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Leaseweb Global B.V."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / ID</label>
              <input
                type="text"
                placeholder="e.g. ACC-19482"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                placeholder="billing@provider.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Support Phone</label>
              <input
                type="text"
                placeholder="+1 800 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Console / Portal URL</label>
            <input
              type="url"
              placeholder="https://console.provider.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Provider
          </button>
        </form>
      </Modal>
    </div>
  );
};
