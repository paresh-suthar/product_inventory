import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService, clientService, invoiceService } from '../../services/api';
import { Server, Client, Invoice } from '../../types';
import { Search, Server as ServerIcon, Users, ReceiptText, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [servers, setServers] = useState<Server[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      serverService.list().then(setServers).catch(() => {});
      clientService.list().then(setClients).catch(() => {});
      invoiceService.list().then(setInvoices).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredServers = query.trim()
    ? servers.filter(
        (s) =>
          s.hostname.toLowerCase().includes(query.toLowerCase()) ||
          s.primary_ip.includes(query) ||
          s.datacenter_location.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredClients = query.trim()
    ? clients.filter(
        (c) =>
          c.company_name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          (c.contact_name && c.contact_name.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const filteredInvoices = query.trim()
    ? invoices.filter(
        (i) =>
          i.invoice_no.toLowerCase().includes(query.toLowerCase()) ||
          i.status.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search servers, IPs, clients, or invoice #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Search by hostname (e.g. <span className="text-slate-400">epyc</span>), IP address, client company name, or invoice number.
            </div>
          ) : filteredServers.length === 0 && filteredClients.length === 0 && filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Servers */}
              {filteredServers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ServerIcon className="w-3.5 h-3.5 text-blue-400" />
                    Servers ({filteredServers.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredServers.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelect('/servers')}
                        className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{s.hostname}</div>
                          <div className="text-[11px] text-slate-400">
                            IP: <span className="text-blue-400 font-mono">{s.primary_ip}</span> &bull; {s.datacenter_location}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients */}
              {filteredClients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Clients ({filteredClients.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect('/clients')}
                        className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{c.company_name}</div>
                          <div className="text-[11px] text-slate-400">{c.email} &bull; {c.contact_name}</div>
                        </div>
                        <span className="text-[10px] font-bold text-purple-400">
                          {c.preferred_currency} {c.wallet ? Number(c.wallet.balance).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {filteredInvoices.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />
                    Invoices ({filteredInvoices.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelect('/invoices')}
                        className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="text-xs font-bold font-mono text-white">{inv.invoice_no}</div>
                          <div className="text-[11px] text-slate-400">Due: {inv.due_date.split('T')[0]}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">
                            {inv.currency} {inv.total_amount.toFixed(2)}
                          </div>
                          <span className={`text-[10px] font-bold ${inv.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
