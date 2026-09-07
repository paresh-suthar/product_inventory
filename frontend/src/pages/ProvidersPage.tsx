import React, { useEffect, useState } from 'react';
import { providerService, serverService } from '../services/api';
import { Provider, Server } from '../types';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  Building2,
  Plus,
  Globe,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Server as ServerIcon,
  DollarSign
} from 'lucide-react';

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Add Provider
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [phone, setPhone] = useState('');

  // Edit Provider
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editAccountNo, setEditAccountNo] = useState('');
  const [editCurrency, setEditCurrency] = useState('EUR');
  const [editPhone, setEditPhone] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([providerService.list(), serverService.list()])
      .then(([pData, sData]) => {
        setProviders(pData);
        setServers(sData);
      })
      .catch(() => showToast('Error loading upstream providers', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
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
      setAccountNo('');
      setPhone('');
      showToast(`Provider ${name} registered!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error registering provider', 'error');
    }
  };

  const handleOpenEdit = (p: Provider) => {
    setSelectedProvider(p);
    setEditName(p.name);
    setEditEmail(p.contact_email || '');
    setEditUrl(p.portal_url || '');
    setEditAccountNo(p.account_number || '');
    setEditCurrency(p.currency);
    setEditPhone(p.support_phone || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    try {
      await providerService.update(selectedProvider.id, {
        name: editName,
        contact_email: editEmail,
        portal_url: editUrl,
        account_number: editAccountNo,
        currency: editCurrency,
        support_phone: editPhone,
      });
      setIsEditModalOpen(false);
      showToast(`Provider ${editName} updated!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error updating provider', 'error');
    }
  };

  const handleDelete = async (p: Provider) => {
    if (!window.confirm(`Are you sure you want to delete ${p.name}?`)) return;
    try {
      await providerService.delete(p.id);
      showToast(`Provider ${p.name} deleted.`, 'info');
      loadData();
    } catch (err) {
      showToast('Error deleting provider', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Upstream Hardware Providers</h1>
          <p className="text-sm text-slate-400">
            Data center vendors, wholesale infrastructure suppliers, and vendor portal access.
          </p>
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
        <div className="p-8 text-center text-slate-400 text-sm">Loading vendors...</div>
      ) : providers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No hardware providers registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => {
            const hostedServers = servers.filter((s) => s.provider_id === p.id);
            const monthlySpend = hostedServers.reduce((acc, s) => acc + Number(s.upstream_cost), 0);

            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      <div className="text-xs text-slate-400">Currency: <b className="text-white">{p.currency}</b></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit provider"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Delete provider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400 flex items-center gap-1">
                      <ServerIcon className="w-3.5 h-3.5 text-blue-400" />
                      Hosted Nodes
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">{hostedServers.length} Servers</div>
                  </div>
                  <div>
                    <div className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                      Monthly Spend
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {p.currency} {monthlySpend.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
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
            );
          })}
        </div>
      )}

      {/* Modal: Edit Provider */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Provider Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Provider Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / ID</label>
              <input
                type="text"
                value={editAccountNo}
                onChange={(e) => setEditAccountNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Currency</label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Support Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Console / Portal URL</label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Provider Changes
          </button>
        </form>
      </Modal>

      {/* Modal: Add Provider */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

export default ProvidersPage;
