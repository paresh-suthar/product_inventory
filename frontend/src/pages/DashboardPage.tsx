import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import { AnalyticsSummary } from '../types';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Server,
  Layers,
  Clock,
  Landmark,
  ShieldAlert,
  BarChart3,
  PlusCircle,
  Receipt,
  Wallet,
  ArrowLeftRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { convertValue, activeCurrency } = useAppStore();

  useEffect(() => {
    analyticsService.getSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Aggregating multi-currency financial records...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Failed to load financial summary. Ensure backend API is operational.
      </div>
    );
  }

  const mrrConverted = convertValue(summary.mrr_base, summary.base_currency);
  const costConverted = convertValue(summary.total_upstream_cost_base, summary.base_currency);
  const profitConverted = convertValue(summary.net_profit_base, summary.base_currency);
  const bankTotalConverted = convertValue(summary.total_bank_balance_base, summary.base_currency);

  const monthlyTrends = summary.monthly_trends || [];
  const maxTrendVal = Math.max(
    ...monthlyTrends.map(t => Math.max(t.revenue, t.spend)),
    100
  );

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Launchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Cloud & Financial Overview</h1>
          <p className="text-sm text-slate-400">
            Real-time multi-currency conversions &bull; Base Accounting: <b className="text-blue-400">{summary.base_currency}</b> &bull; Active Display: <b className="text-emerald-400">{activeCurrency}</b>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/servers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> + Server
          </Link>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
          >
            <Receipt className="w-3.5 h-3.5" /> + Invoice
          </Link>
          <Link
            to="/clients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
          >
            <Wallet className="w-3.5 h-3.5" /> Top-Up Wallet
          </Link>
          <Link
            to="/banks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Monthly Recurring Revenue (MRR)"
          value={mrrConverted.formatted}
          subtitle="Converted from client contracts"
          icon={TrendingUp}
          color="emerald"
          trend="+12.4% vs last month"
        />
        <StatCard
          title="Upstream Server Spend"
          value={costConverted.formatted}
          subtitle="Vendor costs (Hetzner, OVH, AWS)"
          icon={DollarSign}
          color="rose"
        />
        <StatCard
          title="Net Infrastructure Profit"
          value={profitConverted.formatted}
          subtitle={`Profit Margin: ${summary.profit_margin_percentage.toFixed(1)}%`}
          icon={ArrowUpRight}
          color="blue"
        />
        <StatCard
          title="Total Cash in Banks & Gateways"
          value={bankTotalConverted.formatted}
          subtitle={`Across ${summary.bank_balances.length} accounts`}
          icon={Landmark}
          color="purple"
        />
      </div>

      {/* Visual Analytics Chart: 6-Month Revenue vs Spend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Financial Velocity: Revenue vs Upstream Spend (6-Month Trend)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual cashflow trajectory converted dynamically into {activeCurrency}.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
              <span className="text-slate-300">Client Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
              <span className="text-slate-300">Provider Spend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              <span className="text-slate-300">Net Profit</span>
            </div>
          </div>
        </div>

        {/* CSS/SVG Bar Chart */}
        <div className="h-52 flex items-end justify-between gap-3 sm:gap-6 pt-6 px-2 border-b border-slate-800">
          {monthlyTrends.map((t) => {
            const revH = Math.max(12, Math.round((t.revenue / maxTrendVal) * 160));
            const spH = Math.max(10, Math.round((t.spend / maxTrendVal) * 160));
            const revConv = convertValue(t.revenue, summary.base_currency);
            const spConv = convertValue(t.spend, summary.base_currency);

            return (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-12 z-20 bg-slate-950 border border-slate-700 text-[10px] text-white p-1.5 rounded shadow-xl whitespace-nowrap">
                  <div>Rev: <b className="text-blue-400">{revConv.formatted}</b></div>
                  <div>Cost: <b className="text-rose-400">{spConv.formatted}</b></div>
                </div>

                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-1.5 h-40">
                  <div
                    style={{ height: `${revH}px` }}
                    className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-blue-700 to-blue-500 group-hover:brightness-125 transition"
                  />
                  <div
                    style={{ height: `${spH}px` }}
                    className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-rose-700 to-rose-500 group-hover:brightness-125 transition"
                  />
                </div>
                <div className="text-xs font-bold text-slate-400">{t.month}</div>
              </div>
            );
          })}
        </div>
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
            <Link to="/banks" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Manage Accounts &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {summary.bank_balances.map((b) => {
              const converted = convertValue(b.balance, b.currency);
              return (
                <div key={b.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
            <Link to="/invoices" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Invoices &rarr;
            </Link>
          </div>
          {summary.upcoming_renewals.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No renewals due in the next 14 days.</div>
          ) : (
            <div className="space-y-3">
              {summary.upcoming_renewals.map((r) => (
                <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

export default DashboardPage;
