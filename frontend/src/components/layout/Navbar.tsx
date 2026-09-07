import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { currencyService } from '../../services/api';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Globe, Bell, User as UserIcon, Menu, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeCurrency, setActiveCurrency, currencies, setCurrencies, toggleMobileSidebar } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    currencyService.list().then(setCurrencies).catch(console.error);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrencies]);

  return (
    <>
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Hamburger & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={toggleMobileSidebar}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-400 text-xs w-full transition group"
          >
            <Search className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
            <span className="truncate">Search servers, IPs, clients...</span>
            <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Currency Selector & User */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          {/* Currency Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 border border-slate-700 px-2 sm:px-3 py-1.5 rounded-lg shrink-0">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium text-slate-400">Display:</span>
            <select
              value={activeCurrency}
              onChange={(e) => setActiveCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Notification Icon */}
          <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* User Pill */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight">Admin User</div>
              <div className="text-[10px] text-slate-400">admin@stockflow.internal</div>
            </div>
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
