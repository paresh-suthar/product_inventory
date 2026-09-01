import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Building2, 
  Users, 
  Landmark, 
  ReceiptText, 
  Coins, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/servers', label: 'Server Inventory', icon: Server },
    { to: '/providers', label: 'Upstream Providers', icon: Building2 },
    { to: '/clients', label: 'Clients & Wallets', icon: Users },
    { to: '/banks', label: 'Banks & Gateways', icon: Landmark },
    { to: '/invoices', label: 'Invoices & Billing', icon: ReceiptText },
    { to: '/currencies', label: 'Currencies & FX', icon: Coins },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            StockFlow <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-400 font-semibold border border-blue-700/50">ERP</span>
          </div>
          <div className="text-[11px] text-slate-400">Server & Financial Platform</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">StockFlow Core</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
