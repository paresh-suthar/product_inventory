import React, { useEffect, useState } from 'react';
import { invoiceService, clientService, bankService } from '../services/api';
import { Invoice, Client, BankAccount } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReceiptText, Download, CheckCircle2, Zap } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadInvoices = () => {
    setLoading(true);
    Promise.all([invoiceService.list(), clientService.list(), bankService.list()])
      .then(([iData, cData, bData]) => {
        setInvoices(iData);
        setClients(cData);
        setBanks(bData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleAutoDebit = async (invoiceId: string) => {
    try {
      await invoiceService.autoDebit(invoiceId);
      alert('Invoice successfully settled via client wallet balance!');
      loadInvoices();
    } catch (err) {
      alert('Auto-debit failed. Ensure client has sufficient wallet balance.');
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    const defaultBank = banks.find(b => b.currency === invoice.currency) || banks[0];
    try {
      await invoiceService.recordPayment(invoice.id, {
        amount: invoice.total_amount,
        currency: invoice.currency,
        payment_method: 'BANK_WIRE',
        bank_account_id: defaultBank ? defaultBank.id : undefined,
        transaction_ref: `MANUAL-${Date.now()}`,
      });
      loadInvoices();
    } catch (err) {
      alert('Error marking invoice paid');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Invoices & Billing</h1>
        <p className="text-sm text-slate-400">Generate branded PDF invoices, track payments, and trigger automated wallet debits.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No invoices generated yet.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
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
                {invoices.map((inv) => {
                  const client = clients.find(c => c.id === inv.client_id);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-5 py-4 font-bold text-white font-mono flex items-center gap-2">
                        <ReceiptText className="w-4 h-4 text-blue-400" />
                        {inv.invoice_no}
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
                      <td className="px-5 py-4 text-right space-x-2">
                        <a
                          href={invoiceService.downloadPdfUrl(inv.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" /> PDF
                        </a>
                        {inv.status === 'UNPAID' && (
                          <>
                            <button
                              onClick={() => handleAutoDebit(inv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-semibold transition"
                            >
                              <Zap className="w-3.5 h-3.5" /> Auto-Debit
                            </button>
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
