import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { currencyService } from '../../services/api';
import { Globe, Bell, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeCurrency, setActiveCurrency, currencies, setCurrencies } = useAppStore();

  useEffect(() => {
    currencyService.list().then(setCurrencies).catch(console.error);
  }, [setCurrencies]);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search / Context info */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-slate-300">
          Global Multi-Currency Dashboard &bull; Live Exchange Conversion Active
        </div>
      </div>

      {/* Right Controls: Currency Selector & User */}
      <div className="flex items-center gap-4">
        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-slate-400">Display Currency:</span>
          <select
            value={activeCurrency}
            onChange={(e) => setActiveCurrency(e.target.value)}
            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Icon */}
        <button className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-white leading-tight">Admin User</div>
            <div className="text-[10px] text-slate-400">admin@stockflow.internal</div>
          </div>
        </div>
      </div>
    </header>
  );
};
