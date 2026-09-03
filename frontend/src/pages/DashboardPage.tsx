import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { AnalyticsSummary } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  TrendingUp, 
  Server, 
  Landmark, 
  ShieldAlert, 
  DollarSign, 
  Layers,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { convertValue } = useAppStore();

  useEffect(() => {
    analyticsService.getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading live financial & server analytics...</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-red-400">Failed to load analytics dashboard.</div>;
  }

  const mrrConverted = convertValue(summary.mrr_base, summary.base_currency);
  const costConverted = convertValue(summary.total_upstream_cost_base, summary.base_currency);
  const profitConverted = convertValue(summary.net_profit_base, summary.base_currency);
  const bankTotalConverted = convertValue(summary.total_bank_balance_base, summary.base_currency);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-slate-400">Real-time overview of servers, provider spend, MRR, and multi-bank balances.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Monthly Recurring Revenue (MRR)"
          value={mrrConverted.formatted}
          subtitle={`Converted from client contracts`}
          icon={TrendingUp}
          color="emerald"
          trend="+12.4% vs last month"
        />
        <StatCard
          title="Upstream Server Spend"
          value={costConverted.formatted}
          subtitle="Total vendor costs (Hetzner, OVH, AWS)"
          icon={DollarSign}
          color="rose"
        />
        <StatCard
          title="Net Infrastructure Profit"
          value={profitConverted.formatted}
          subtitle={`Profit Margin: ${summary.profit_margin_percentage}%`}
          icon={ArrowUpRight}
          color="blue"
        />
        <StatCard
          title="Total Cash in Banks & Gateways"
          value={bankTotalConverted.formatted}
          subtitle={`Across ${summary.bank_balances.length} corporate accounts`}
          icon={Landmark}
          color="purple"
        />
      </div>

      {/* Server Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Total Server Nodes</div>
            <div className="text-3xl font-bold text-white mt-1">{summary.total_servers}</div>
            <div className="text-xs text-slate-400 mt-1">Managed across all datacenters</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Active / Assigned Servers</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{summary.assigned_servers}</div>
            <div className="text-xs text-slate-400 mt-1">Generating recurring monthly cashflow</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Available Inventory</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">{summary.available_servers}</div>
            <div className="text-xs text-slate-400 mt-1">Ready for instant client allocation</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Bank Balances & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Bank Balances */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-400" />
              Corporate Bank & Gateway Balances
            </h3>
          </div>
          <div className="space-y-3">
            {summary.bank_balances.map((b) => {
              const converted = convertValue(b.balance, b.currency);
              return (
                <div key={b.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{b.account_name}</div>
                    <div className="text-xs text-slate-400">{b.bank_name} &bull; Native: {b.currency} {b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{converted.formatted}</div>
                    <div className="text-[10px] text-slate-500">Converted Value</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Renewals Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Upcoming Renewal Radar (Next 14 Days)
            </h3>
          </div>
          {summary.upcoming_renewals.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No renewals due in the next 14 days.</div>
          ) : (
            <div className="space-y-3">
              {summary.upcoming_renewals.map((r) => (
                <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-slate-400">Due: <span className="text-amber-400 font-semibold">{r.due_date}</span> ({r.days_left} days left)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{r.currency} {r.amount.toFixed(2)}</div>
                    <StatusBadge status="ACTIVE" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
