import React from 'react';

const statusConfig = {
  // Seller Approval statuses
  approved: {
    label: 'Approved & Verified',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  under_review: {
    label: 'Under Admin Review',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 animate-pulse',
  },
  pending_verification: {
    label: 'Pending Admin Approval',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  rejected: {
    label: 'Application Rejected',
    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  suspended: {
    label: 'Account Suspended',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
  },

  // Product statuses
  draft: {
    label: 'Draft Listing',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  pending_approval: {
    label: 'Pending Approval',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 animate-pulse',
  },

  // Order statuses (Required: Pending, Processing, Shipped, Delivered, Cancelled)
  new: {
    label: 'Pending',
    bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500 animate-pulse',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500 animate-pulse',
  },
  accepted: {
    label: 'Processing',
    bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  packing: {
    label: 'Packing',
    bg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
  },
  packed: {
    label: 'Packed & Labeled',
    bg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
  },
  ready_to_ship: {
    label: 'Ready for Pickup',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  pickup_scheduled: {
    label: 'Pickup Scheduled',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-600',
  },
  in_transit: {
    label: 'In Transit',
    bg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-600 animate-pulse',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 animate-bounce',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  order_rejected: {
    label: 'Order Rejected',
    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  return_requested: {
    label: 'Return Requested',
    bg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500 animate-pulse',
  },
  returned: {
    label: 'Returned',
    bg: 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    dot: 'bg-orange-600',
  },
  refunded: {
    label: 'Refund Processed',
    bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },

  // Payout statuses
  payout_pending: {
    label: 'Payout In Queue',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Settled to Bank',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
};

export const StatusBadge = ({ status, customLabel, size = 'md' }) => {
  const normalized = (status || '').toLowerCase().trim();
  const config = statusConfig[normalized] || {
    label: customLabel || status || 'Active',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3.5 py-1.5 text-xs font-extrabold',
  }[size] || 'px-2.5 py-1 text-xs font-bold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${sizeClasses} ${config.bg} capitalize tracking-tight transition-all duration-200`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{customLabel || config.label}</span>
    </span>
  );
};

export default StatusBadge;
