import React, { useEffect, useState } from 'react';
import { invoiceService, clientService, bankService } from '../services/api';
import { Invoice, Client, BankAccount } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  ReceiptText,
  Download,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  Eye,
  Search,
  Landmark,
  Calendar
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { showToast } = useToast();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Manual Invoice Form
  const [newClientId, setNewClientId] = useState('');
  const [newDesc, setNewDesc] = useState('Dedicated Cloud Infrastructure Services');
  const [newAmount, setNewAmount] = useState(199);
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newDueDays, setNewDueDays] = useState(14);
  const [newBankId, setNewBankId] = useState('');

  const loadInvoices = () => {
    setLoading(true);
    Promise.all([invoiceService.list(), clientService.list(), bankService.list()])
      .then(([iData, cData, bData]) => {
        setInvoices(iData);
        setClients(cData);
        setBanks(bData);
        if (cData.length > 0 && !newClientId) setNewClientId(cData[0].id);
        if (bData.length > 0 && !newBankId) setNewBankId(bData[0].id);
      })
      .catch(() => showToast('Error loading invoices', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoiceService.createManual({
        client_id: newClientId,
        description: newDesc,
        total_amount: Number(newAmount),
        currency: newCurrency,
        due_days: Number(newDueDays),
        bank_account_id: newBankId || undefined,
      });
      setIsCreateModalOpen(false);
      showToast('Custom invoice issued successfully!', 'success');
      loadInvoices();
    } catch (err) {
      showToast('Error creating invoice', 'error');
    }
  };

  const handleAutoDebit = async (invoiceId: string) => {
    try {
      await invoiceService.autoDebit(invoiceId);
      showToast('Invoice settled automatically via client credit wallet!', 'success');
      loadInvoices();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Auto-debit failed. Insufficient wallet balance.', 'error');
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    const defaultBank = banks.find((b) => b.currency === invoice.currency) || banks[0];
    try {
      await invoiceService.recordPayment(invoice.id, {
        amount: invoice.total_amount,
        currency: invoice.currency,
        payment_method: 'BANK_WIRE',
        bank_account_id: defaultBank ? defaultBank.id : undefined,
        transaction_ref: `WIRE-${Date.now().toString().slice(-6)}`,
      });
      showToast(`Invoice ${invoice.invoice_no} marked as paid!`, 'success');
      loadInvoices();
    } catch (err) {
      showToast('Error marking invoice paid', 'error');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_no}?`)) {
      return;
    }
    try {
      await invoiceService.delete(invoice.id);
      showToast(`Invoice ${invoice.invoice_no} deleted.`, 'info');
      loadInvoices();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err) {
      showToast('Error deleting invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const client = clients.find((c) => c.id === inv.client_id);
    return (
      inv.invoice_no.toLowerCase().includes(q) ||
      (client && client.company_name.toLowerCase().includes(q)) ||
      inv.currency.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoices & Billing Operations</h1>
          <p className="text-sm text-slate-400">
            Generate branded PDF tax invoices, trigger automated wallet debits, and record bank settlements.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Create New Invoice
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {['ALL', 'UNPAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {status} ({status === 'ALL' ? invoices.length : invoices.filter((i) => i.status === status).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice #, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading billing records...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No invoices found matching criteria.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.client_id);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-5 py-4 font-bold text-white font-mono flex items-center gap-2">
                        <ReceiptText className="w-4 h-4 text-blue-400" />
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsDetailModalOpen(true);
                          }}
                          className="hover:underline text-left font-mono"
                        >
                          {inv.invoice_no}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {client ? client.company_name : 'Unknown Client'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{inv.issue_date.split('T')[0]}</td>
                      <td className="px-5 py-4 text-slate-400">{inv.due_date.split('T')[0]}</td>
                      <td className="px-5 py-4 font-bold text-white text-sm">
                        {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <a
                          href={invoiceService.downloadPdfUrl(inv.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" /> PDF
                        </a>

                        {inv.status === 'UNPAID' && (
                          <>
                            <button
                              onClick={() => handleAutoDebit(inv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-semibold transition"
                              title="Auto-debit client wallet balance"
                            >
                              <Zap className="w-3.5 h-3.5" /> Auto-Debit
                            </button>
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                              title="Mark paid via Bank Wire"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invoice Details Preview */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedInvoice ? `Invoice Details: ${selectedInvoice.invoice_no}` : 'Invoice'}
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400">Invoice Number</div>
                  <div className="font-mono text-base font-bold text-white">{selectedInvoice.invoice_no}</div>
                </div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>Issue Date: <b className="text-white">{selectedInvoice.issue_date.split('T')[0]}</b></div>
                <div>Due Date: <b className="text-amber-400">{selectedInvoice.due_date.split('T')[0]}</b></div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="text-slate-400">Description:</div>
              <div className="font-semibold text-white">{selectedInvoice.notes || 'Infrastructure Provisioning'}</div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                <span>Total Amount Due:</span>
                <span className="text-emerald-400">{selectedInvoice.currency} {selectedInvoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <a
                href={invoiceService.downloadPdfUrl(selectedInvoice.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Download Official PDF Invoice
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Manual Invoice */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Issue Custom Client Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Client</label>
            <select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Service Description / Line Item</label>
            <input
              type="text"
              required
              placeholder="e.g. Dedicated Hardware Setup & IP Subnet Allocation"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Currency</label>
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Window (Days)</label>
              <input
                type="number"
                required
                value={newDueDays}
                onChange={(e) => setNewDueDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Designated Bank Account</label>
              <select
                value={newBankId}
                onChange={(e) => setNewBankId(e.target.value)}
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
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Issue Invoice & Generate PDF
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
