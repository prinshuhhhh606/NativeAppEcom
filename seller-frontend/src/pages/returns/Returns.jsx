import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getReturns();
      setReturns(res.data.returns || res.data || []);
    } catch (err) {
      toast.error('Failed to load customer returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleProcess = async (id, status) => {
    setSubmitting(true);
    try {
      await sellerService.processReturn(id, {
        status, // 'approved' | 'rejected'
        notes: actionNotes,
      });
      toast.success(`Return request ${status}!`);
      setSelectedReturn(null);
      setActionNotes('');
      fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Returns, Replacements & Disputes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage buyer return requests, inspect return reasons, and authorize reverse pickups.
          </p>
        </div>

        <button
          onClick={fetchReturns}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">Return Request ID</th>
                <th className="py-3.5 px-4">Sub-Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Reason for Return</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {returns.length > 0 ? (
                returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-gray-900 dark:text-white">
                      {ret._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-600 dark:text-gray-300">
                      {ret.subOrderNumber || ret.orderNumber || 'SO-REF'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200">
                      {ret.customerName || 'Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <p className="font-semibold">{ret.reason || 'Size mismatch / quality defect'}</p>
                      {ret.comments && <p className="text-[10px] text-gray-400">{ret.comments}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ret.status || 'return_requested'} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-gray-800 dark:text-gray-200 transition-colors"
                      >
                        Inspect Request
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No return requests on file</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Your return rate is currently 0%! Excellent customer satisfaction.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Return Modal */}
      {selectedReturn && (
        <Modal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title={`Return Inspection — ${selectedReturn._id.slice(-8).toUpperCase()}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl space-y-1">
              <p>
                <span className="text-gray-400">Sub-Order:</span>{' '}
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {selectedReturn.subOrderNumber || 'N/A'}
                </span>
              </p>
              <p>
                <span className="text-gray-400">Buyer:</span>{' '}
                <span className="font-bold text-gray-900 dark:text-white">{selectedReturn.customerName}</span>
              </p>
              <p>
                <span className="text-gray-400">Claim:</span> {selectedReturn.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Seller Disposition Notes
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter remarks for customer and reverse logistics..."
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Close
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleProcess(selectedReturn._id, 'rejected')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                Reject Claim
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleProcess(selectedReturn._id, 'approved')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                Authorize Return
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Returns;

