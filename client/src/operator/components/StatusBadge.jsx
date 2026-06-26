import React from 'react';

const statusConfig = {
  queued:    { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  printing:  { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  printed:   { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  ready:     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.queued;
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}
