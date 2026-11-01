import React, { useState, useEffect } from 'react';
import { CreditCard, Search, ArrowUpRight, CheckCircle, Clock, AlertCircle, RefreshCcw, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = `/payments?page=${page}&limit=15`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      const res = await api.get(query);
      setPayments(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRefund = (p) => {
    setSelectedPayment(p);
    setRefundAmount(p.amount);
    setRefundReason('Customer requested refund / order cancellation');
    setIsRefundModalOpen(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/refund', {
        paymentId: selectedPayment._id,
        amount: Number(refundAmount),
        reason: refundReason,
      });
      toast.success(`Refund of ₹${refundAmount} processed successfully`);
      setIsRefundModalOpen(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'Refund processing failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Payments & Transactions
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Razorpay gateway transactions, COD settlements, status reconciliation and refunds.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex space-x-1.5 overflow-x-auto text-xs">
        {['all', 'Captured', 'Pending', 'Refunded', 'Failed'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}>
            {st === 'all' ? 'All Transactions' : st}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Transaction / Gateway ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No transactions recorded
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                      {p.transactionId || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {p.order?.orderId || 'Direct'}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      {p.user?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-semibold">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-black text-sm text-gray-900 dark:text-white">
                      ₹{p.amount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'Captured'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                            : p.status === 'Refunded'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                        }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'Captured' && (
                        <button
                          onClick={() => handleOpenRefund(p)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors">
                          Issue Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Refund Modal */}
      {isRefundModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
              Process Gateway Refund
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Initiate refund for Transaction ID:{' '}
              <span className="font-mono">{selectedPayment.transactionId}</span>
            </p>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Refund Reason
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none text-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm">
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

