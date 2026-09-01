import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'AVAILABLE':
      case 'PAID':
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ASSIGNED':
      case 'MONTHLY':
      case 'BANK':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'UNPAID':
      case 'MAINTENANCE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OVERDUE':
      case 'TERMINATED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'GATEWAY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStyle()}`}>
      {status}
    </span>
  );
};
