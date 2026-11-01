import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';

export const Earnings = () => {
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, ledgRes] = await Promise.all([
        sellerService.getEarningsSummary(),
        sellerService.getLedger(),
      ]);
      setSummary(sumRes.data);
      setLedger(ledgRes.data.ledger || []);
    } catch (err) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = {
    grossSales: summary?.grossRevenue ?? summary?.metrics?.grossSales ?? 0,
    totalCommission: summary?.platformCommission ?? summary?.metrics?.totalCommission ?? 0,
    netEarnings: summary?.netEarnings ?? summary?.metrics?.netEarnings ?? 0,
    availableBalance: summary?.availableBalance ?? summary?.metrics?.availableBalance ?? 0,
    pendingBalance: summary?.pendingBalance ?? summary?.metrics?.pendingBalance ?? 0,
    withdrawnTotal: summary?.totalWithdrawn ?? summary?.metrics?.withdrawnTotal ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Earnings & Financial Ledger
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Audit-grade double-entry ledger tracking order credits, commission deductions, and bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/payouts"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Request Bank Payout</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Balance"
          value={`₹${(metrics.availableBalance || 0).toLocaleString('en-IN')}`}
          subtitle="Ready for instant bank withdrawal"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Pending Settlement"
          value={`₹${(metrics.pendingBalance || 0).toLocaleString('en-IN')}`}
          subtitle="Funds locked until courier confirms delivery"
          icon={CircleDollarSign}
          color="amber"
        />
        <StatCard
          title="Gross Marketplace Revenue"
          value={`₹${(metrics.grossSales || 0).toLocaleString('en-IN')}`}
          subtitle="Total customer checkout value"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Platform Commission Paid"
          value={`₹${(metrics.totalCommission || 0).toLocaleString('en-IN')}`}
          subtitle="Aggregated platform fee deduction"
          icon={ArrowDownLeft}
          color="purple"
        />
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Transaction Audit Trail</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Immutable ledger entries with running balance verification
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {ledger.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">Date & Time</th>
                <th className="py-3.5 px-4">Transaction Type</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-5 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {ledger.length > 0 ? (
                ledger.map((entry) => {
                  const isCredit =
                    entry.type === 'credit_order' ||
                    entry.type === 'credit_adjustment' ||
                    entry.direction === 'credit' ||
                    entry.amount > 0;

                  return (
                    <tr
                      key={entry._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {entry.type?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200">
                        <p className="font-semibold">{entry.description || entry.notes || 'Ledger Entry'}</p>
                        {entry.referenceId && (
                          <p className="text-[10px] font-mono text-gray-400">Ref: {entry.referenceId}</p>
                        )}
                      </td>

                      <td
                        className={`py-3.5 px-4 font-extrabold text-sm ${
                          isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹{Math.abs(entry.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-5 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ₹{(entry.balanceAfter || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    <CircleDollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No financial entries yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Once orders are delivered, ledger entries and commission settlements will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
