import React, { useEffect, useState } from 'react';
import { currencyService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { Modal } from '../components/common/Modal';
import { Coins, Plus } from 'lucide-react';

export const CurrenciesPage: React.FC = () => {
  const { currencies, setCurrencies } = useAppStore();
  // loading state
  const [, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('$');
  const [rate, setRate] = useState(1.0);

  const loadCurrencies = () => {
    setLoading(true);
    currencyService.list()
      .then(setCurrencies)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const handleUpdateRate = async (code: string, newRate: number) => {
    try {
      await currencyService.update(code, { exchange_rate_to_base: newRate });
      loadCurrencies();
    } catch (err) {
      alert('Error updating rate');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await currencyService.create({
        code: code.toUpperCase(),
        name,
        symbol,
        exchange_rate_to_base: Number(rate),
        is_base: false,
      });
      setIsModalOpen(false);
      loadCurrencies();
    } catch (err) {
      alert('Error adding currency');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Currencies & FX Rates</h1>
          <p className="text-sm text-slate-400">Master exchange rate matrix (Base Currency: USD). Update live conversion rates.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Add Currency
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Currency Name</th>
              <th className="px-5 py-3.5">Symbol</th>
              <th className="px-5 py-3.5">Exchange Rate (1 USD = X)</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5 text-right">Edit Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {currencies.map((c) => (
              <tr key={c.code} className="hover:bg-slate-800/50 transition">
                <td className="px-5 py-4 font-bold text-white font-mono flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-400" />
                  {c.code}
                </td>
                <td className="px-5 py-4 font-semibold text-white">{c.name}</td>
                <td className="px-5 py-4 text-lg font-bold text-emerald-400">{c.symbol}</td>
                <td className="px-5 py-4 font-mono font-bold text-white">
                  {Number(c.exchange_rate_to_base).toFixed(4)}
                </td>
                <td className="px-5 py-4">
                  {c.is_base ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      MASTER BASE
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Secondary</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  {!c.is_base && (
                    <button
                      onClick={() => {
                        const val = prompt(`Enter new exchange rate for ${c.code} (1 USD = ? ${c.code})`, String(c.exchange_rate_to_base));
                        if (val) handleUpdateRate(c.code, Number(val));
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Supported Currency">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">3-Letter Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CAD"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Symbol</label>
              <input
                type="text"
                required
                placeholder="e.g. C$"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Currency Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Canadian Dollar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Exchange Rate to Base (1 USD = X)</label>
            <input
              type="number"
              step="0.0001"
              required
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg transition mt-4"
          >
            Add Currency to Matrix
          </button>
        </form>
      </Modal>
    </div>
  );
};
