import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, Eye, AlertCircle, IndianRupee } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns');
      setReturns(res.data || []);
    } catch (err) {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = async (id, status) => {
    try {
      await api.patch(`/returns/${id}/process`, {
        status,
        adminNotes: `Processed as ${status} by Admin`,
      });
      toast.success(`Return request marked as ${status}`);
      fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Return & Refund Requests
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Inspect customer return submissions, verify 7-day policy windows, restore stock and dispatch refunds.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading return requests...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No return requests registered
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {r.order?.orderId || 'Order'}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      <p className="font-bold">{r.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-gray-400">{r.user?.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {r.reason}
                    </td>
                    <td className="py-3 px-4 font-black text-sm text-gray-900 dark:text-white">
                      ₹{r.refundAmount || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Approved' || r.status === 'Refunded'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                            : r.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                        }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'Pending' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleProcessReturn(r._id, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs">
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessReturn(r._id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs">
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'Approved' && (
                        <button
                          onClick={() => handleProcessReturn(r._id, 'Refunded')}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs">
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
    </div>
  );
};

export default Returns;

