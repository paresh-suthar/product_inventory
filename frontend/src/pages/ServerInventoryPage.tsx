import React, { useEffect, useState } from 'react';
import { serverService, providerService, clientService, subscriptionService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { Server, Provider, Client } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Server as ServerIcon, Plus, Cpu, HardDrive, Network, MapPin, CheckCircle2 } from 'lucide-react';

export const ServerInventoryPage: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // Form states
  const [hostname, setHostname] = useState('');
  const [providerId, setProviderId] = useState('');
  const [location, setLocation] = useState('');
  const [cpu, setCpu] = useState('');
  const [ram, setRam] = useState(64);
  const [storage, setStorage] = useState('');
  const bandwidth = '1 Gbps Unmetered';
  const [primaryIp, setPrimaryIp] = useState('');
  const [upstreamCost, setUpstreamCost] = useState(99);
  const [upstreamCurrency, setUpstreamCurrency] = useState('EUR');

  // Assign Form states
  const [assignClientId, setAssignClientId] = useState('');
  const [planName, setPlanName] = useState('');
  const [sellingPrice, setSellingPrice] = useState(199);
  const [sellingCurrency, setSellingCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const { convertValue } = useAppStore();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      serverService.list(filterStatus === 'ALL' ? undefined : filterStatus),
      providerService.list(),
      clientService.list(),
    ]).then(([sData, pData, cData]) => {
      setServers(sData);
      setProviders(pData);
      setClients(cData);
      if (pData.length > 0) setProviderId(pData[0].id);
      if (cData.length > 0) setAssignClientId(cData[0].id);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await serverService.create({
        hostname,
        provider_id: providerId,
        datacenter_location: location,
        cpu,
        ram_gb: Number(ram),
        storage,
        bandwidth,
        primary_ip: primaryIp,
        upstream_cost: Number(upstreamCost),
        upstream_currency: upstreamCurrency,
        status: 'AVAILABLE',
      });
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error creating server');
    }
  };

  const handleAssignServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    try {
      await subscriptionService.create({
        client_id: assignClientId,
        server_id: selectedServer.id,
        plan_name: planName || `${selectedServer.cpu} Dedicated Plan`,
        selling_price: Number(sellingPrice),
        currency: sellingCurrency,
        billing_cycle: billingCycle,
        auto_renew_from_wallet: 'YES',
      });
      setIsAssignModalOpen(false);
      setSelectedServer(null);
      loadData();
    } catch (err) {
      alert('Error allocating server');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Server & Hardware Inventory</h1>
          <p className="text-sm text-slate-400">Manage dedicated bare-metal servers, VPS nodes, and IP address allocations.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Add New Server
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'AVAILABLE', 'ASSIGNED', 'MAINTENANCE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Server List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading server catalog...</div>
      ) : servers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No servers found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {servers.map((server) => {
            const costConverted = convertValue(server.upstream_cost, server.upstream_currency);
            return (
              <div key={server.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4">
                {/* Top Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ServerIcon className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-base">{server.hostname}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {server.datacenter_location} {server.rack_node_id && `(${server.rack_node_id})`}
                    </div>
                  </div>
                  <StatusBadge status={server.status} />
                </div>

                {/* Hardware Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{server.cpu} ({server.ram_gb} GB RAM)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">{server.storage}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Network className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">Primary IP: <b className="text-white">{server.primary_ip}</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">{server.bandwidth}</span>
                  </div>
                </div>

                {/* Footer Cost & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div>
                    <div className="text-[11px] text-slate-500">Upstream Monthly Cost:</div>
                    <div className="text-sm font-bold text-white">
                      {server.upstream_currency} {server.upstream_cost.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1.5">({costConverted.formatted})</span>
                    </div>
                  </div>
                  {server.status === 'AVAILABLE' ? (
                    <button
                      onClick={() => {
                        setSelectedServer(server);
                        setPlanName(`${server.cpu} High-Performance Dedicated Plan`);
                        setIsAssignModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      Assign to Client
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Assigned & Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Server */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Server to Inventory">
        <form onSubmit={handleCreateServer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hostname</label>
            <input
              type="text"
              required
              placeholder="e.g. de-fra-epyc-05.stockflow.net"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Upstream Provider</label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Datacenter / Region</label>
              <input
                type="text"
                required
                placeholder="e.g. Falkenstein (DE) - DC12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CPU Model & Cores</label>
              <input
                type="text"
                required
                placeholder="e.g. AMD EPYC 7702 (64 Cores)"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">RAM (GB)</label>
              <input
                type="number"
                required
                value={ram}
                onChange={(e) => setRam(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Disks</label>
              <input
                type="text"
                required
                placeholder="e.g. 2x 1.92TB NVMe SSD"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary IP Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 136.243.104.55"
                value={primaryIp}
                onChange={(e) => setPrimaryIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Provider Cost</label>
              <input
                type="number"
                step="0.01"
                required
                value={upstreamCost}
                onChange={(e) => setUpstreamCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cost Currency</label>
              <select
                value={upstreamCurrency}
                onChange={(e) => setUpstreamCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Server to Inventory
          </button>
        </form>
      </Modal>

      {/* Modal: Assign Server */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Allocate Server to Client">
        {selectedServer && (
          <form onSubmit={handleAssignServer} className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <div>Server: <b className="text-white">{selectedServer.hostname}</b></div>
              <div>Specs: {selectedServer.cpu} | {selectedServer.ram_gb}GB RAM | {selectedServer.storage}</div>
              <div>Upstream Cost: {selectedServer.upstream_currency} {selectedServer.upstream_cost.toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Client</label>
              <select
                value={assignClientId}
                onChange={(e) => setAssignClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.contact_name}) - Balance: {c.preferred_currency} {c.wallet?.balance || 0}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Plan Name</label>
              <input
                type="text"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price (per cycle)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Currency</label>
                <select
                  value={sellingCurrency}
                  onChange={(e) => setSellingCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly (3 Months)</option>
                <option value="ANNUAL">Annual (12 Months)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
            >
              Allocate & Issue First Invoice
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
