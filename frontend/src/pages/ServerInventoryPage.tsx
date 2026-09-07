import React, { useEffect, useState } from 'react';
import { serverService, providerService, clientService, subscriptionService } from '../services/api';
import { Server, Provider, Client } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Server as ServerIcon,
  Plus,
  Cpu,
  HardDrive,
  Network,
  MapPin,
  CheckCircle2,
  Edit2,
  Trash2,
  Power,
  RotateCw,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ExternalLink,
  PlusCircle,
  X
} from 'lucide-react';

export const ServerInventoryPage: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { convertValue } = useAppStore();
  const { showToast } = useToast();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // Add Server Form
  const [hostname, setHostname] = useState('');
  const [providerId, setProviderId] = useState('');
  const [location, setLocation] = useState('');
  const [cpu, setCpu] = useState('');
  const [ram, setRam] = useState(64);
  const [storage, setStorage] = useState('');
  const [primaryIp, setPrimaryIp] = useState('');
  const [upstreamCost, setUpstreamCost] = useState(85);
  const [upstreamCurrency, setUpstreamCurrency] = useState('EUR');

  // Edit Server Form
  const [editHostname, setEditHostname] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editStatus, setEditStatus] = useState<any>('AVAILABLE');
  const [editNotes, setEditNotes] = useState('');

  // Assign Form
  const [assignClientId, setAssignClientId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(149);
  const [sellingCurrency, setSellingCurrency] = useState('USD');
  const [planName, setPlanName] = useState('');

  // Add IP form
  const [newIpAddress, setNewIpAddress] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      serverService.list(statusFilter === 'ALL' ? undefined : statusFilter),
      providerService.list(),
      clientService.list()
    ])
      .then(([sData, pData, cData]) => {
        setServers(sData);
        setProviders(pData);
        setClients(cData);
        if (pData.length > 0 && !providerId) setProviderId(pData[0].id);
        if (cData.length > 0 && !assignClientId) setAssignClientId(cData[0].id);
      })
      .catch((err) => {
        console.error(err);
        showToast('Error loading server inventory', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

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
        bandwidth: '1 Gbps Unmetered',
        primary_ip: primaryIp,
        upstream_cost: Number(upstreamCost),
        upstream_currency: upstreamCurrency,
        provider_renewal_day: 1,
        status: 'AVAILABLE',
      });
      setIsAddModalOpen(false);
      showToast(`Server ${hostname} registered successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error registering server. Ensure IP is unique.', 'error');
    }
  };

  const handleAssignServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    try {
      await subscriptionService.create({
        client_id: assignClientId,
        server_id: selectedServer.id,
        plan_name: planName,
        selling_price: Number(sellingPrice),
        currency: sellingCurrency,
        billing_cycle: 'MONTHLY',
        auto_renew_from_wallet: 'YES',
      });
      setIsAssignModalOpen(false);
      setSelectedServer(null);
      showToast(`Server assigned to client successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error allocating server to client', 'error');
    }
  };

  const handlePowerAction = async (server: Server, action: string) => {
    try {
      const res = await serverService.powerAction(server.id, action);
      showToast(res.message, 'info');
      loadData();
      if (selectedServer && selectedServer.id === server.id) {
        setSelectedServer({ ...selectedServer, status: res.status });
      }
    } catch (err) {
      showToast(`Failed to execute power action: ${action}`, 'error');
    }
  };

  const handleReleaseServer = async (server: Server) => {
    if (!window.confirm(`Are you sure you want to release server "${server.hostname}"? Active client subscriptions will be cancelled and the server will become AVAILABLE.`)) {
      return;
    }
    try {
      const res = await serverService.release(server.id);
      showToast(res.message, 'success');
      loadData();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err) {
      showToast('Failed to release server', 'error');
    }
  };

  const handleDeleteServer = async (server: Server) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${server.hostname}" from inventory?`)) {
      return;
    }
    try {
      await serverService.delete(server.id);
      showToast(`Server ${server.hostname} deleted.`, 'info');
      loadData();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Cannot delete assigned server', 'error');
    }
  };

  const handleOpenEdit = (server: Server) => {
    setSelectedServer(server);
    setEditHostname(server.hostname);
    setEditLocation(server.datacenter_location);
    setEditCost(server.upstream_cost);
    setEditStatus(server.status);
    setEditNotes(server.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    try {
      await serverService.update(selectedServer.id, {
        hostname: editHostname,
        datacenter_location: editLocation,
        upstream_cost: Number(editCost),
        status: editStatus,
        notes: editNotes,
      });
      setIsEditModalOpen(false);
      showToast(`Server ${editHostname} updated!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error updating server details', 'error');
    }
  };

  const handleAddSecondaryIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer || !newIpAddress.trim()) return;
    try {
      await serverService.addIp(selectedServer.id, {
        ip_address: newIpAddress.trim(),
        subnet_mask: '255.255.255.255',
        is_primary: false,
      });
      showToast(`IP ${newIpAddress} added to pool!`, 'success');
      setNewIpAddress('');
      // Refresh current server
      const updated = await serverService.get(selectedServer.id);
      setSelectedServer(updated);
      loadData();
    } catch (err) {
      showToast('Error adding IP address', 'error');
    }
  };

  const handleDeleteIp = async (ipId: string) => {
    if (!selectedServer) return;
    try {
      await serverService.deleteIp(selectedServer.id, ipId);
      showToast('Secondary IP deleted', 'info');
      const updated = await serverService.get(selectedServer.id);
      setSelectedServer(updated);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error deleting IP', 'error');
    }
  };

  const filteredServers = servers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.hostname.toLowerCase().includes(q) ||
      s.primary_ip.includes(q) ||
      s.datacenter_location.toLowerCase().includes(q) ||
      s.cpu.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & New Server Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dedicated & Cloud Server Inventory</h1>
          <p className="text-sm text-slate-400">
            Hardware provisioning, IPAM pools, client assignments, and remote lifecycle management.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Register New Server
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {['ALL', 'AVAILABLE', 'ASSIGNED', 'MAINTENANCE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {status} ({status === 'ALL' ? servers.length : servers.filter((s) => s.status === status).length})
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search hostname, IP, DC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Server Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading infrastructure nodes...</div>
      ) : filteredServers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No servers matching the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredServers.map((server) => {
            const costConverted = convertValue(server.upstream_cost, server.upstream_currency);
            return (
              <div
                key={server.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4 relative group"
              >
                {/* Top Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ServerIcon className="w-4 h-4 text-blue-400" />
                      <button
                        onClick={() => {
                          setSelectedServer(server);
                          setIsDetailModalOpen(true);
                        }}
                        className="font-bold text-white text-base hover:text-blue-400 transition text-left"
                      >
                        {server.hostname}
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {server.datacenter_location} {server.rack_node_id && `(${server.rack_node_id})`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={server.status} />
                    <button
                      onClick={() => handleOpenEdit(server)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit server"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Delete server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hardware Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
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

                {/* Footer Cost & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                  <div>
                    <div className="text-[11px] text-slate-500">Upstream Monthly Cost:</div>
                    <div className="text-sm font-bold text-white">
                      {server.upstream_currency} {server.upstream_cost.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1.5">({costConverted.formatted})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedServer(server);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Details & IPAM
                    </button>

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
                    ) : server.status === 'ASSIGNED' ? (
                      <button
                        onClick={() => handleReleaseServer(server)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                      >
                        Unassign
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Server Details & Remote IPAM / Power Actions */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedServer ? `Server Console & IPAM: ${selectedServer.hostname}` : 'Server Console'}
      >
        {selectedServer && (
          <div className="space-y-5">
            {/* Status & Power Bar */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Datacenter & Location</div>
                  <div className="text-sm font-bold text-white">{selectedServer.datacenter_location}</div>
                </div>
                <StatusBadge status={selectedServer.status} />
              </div>

              {/* Lifecycle Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePowerAction(selectedServer, 'REBOOT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Reboot
                </button>
                <button
                  onClick={() => handlePowerAction(selectedServer, 'RESCUE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Netboot Rescue
                </button>
                <button
                  onClick={() => handlePowerAction(selectedServer, 'POWER_OFF')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                >
                  <Power className="w-3.5 h-3.5" /> Power Off
                </button>
              </div>
            </div>

            {/* IPAM Subnet / IP Pool */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-blue-400" />
                Allocated IP Address Pool (IPAM)
              </h4>

              <div className="space-y-1.5">
                {selectedServer.ip_addresses && selectedServer.ip_addresses.length > 0 ? (
                  selectedServer.ip_addresses.map((ip) => (
                    <div
                      key={ip.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{ip.ip_address}</span>
                        {ip.is_primary && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      {!ip.is_primary && (
                        <button
                          onClick={() => handleDeleteIp(ip.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Remove secondary IP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">No IP addresses recorded.</div>
                )}
              </div>

              {/* Add Secondary IP Form */}
              <form onSubmit={handleAddSecondaryIp} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add secondary IPv4 or IPv6..."
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  + Add IP
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Server Details */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Server Specifications">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hostname</label>
            <input
              type="text"
              required
              value={editHostname}
              onChange={(e) => setEditHostname(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Datacenter / Region</label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lifecycle Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Provider Cost</label>
            <input
              type="number"
              step="0.01"
              required
              value={editCost}
              onChange={(e) => setEditCost(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Save Changes
          </button>
        </form>
      </Modal>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_name} - {c.preferred_currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Display Name</label>
              <input
                type="text"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Selling Price (Monthly)</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Currency</label>
                <select
                  value={sellingCurrency}
                  onChange={(e) => setSellingCurrency(e.target.value)}
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
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
            >
              Confirm Server Allocation & Start Billing
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ServerInventoryPage;
