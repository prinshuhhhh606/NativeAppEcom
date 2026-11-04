import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Truck,
  IndianRupee,
  Layers,
  ChevronRight,
  Filter,
  Calendar,
  Eye,
  FileCheck2,
  Package,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Inspection & Decision Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('Product damaged by buyer misuse');
  const [submitting, setSubmitting] = useState(false);

  // Return Submenus as requested in prompt:
  // Return Requests, Approved Returns, Rejected Returns, Return Pickup, Returned Products, Exchange Requests, Refund Processing, Refund Completed
  const returnTabs = [
    { id: 'all', label: 'All Returns' },
    { id: 'requested', label: 'Return Requests' },
    { id: 'approved', label: 'Approved Returns' },
    { id: 'rejected', label: 'Rejected Returns' },
    { id: 'pickup', label: 'Return Pickup' },
    { id: 'returned', label: 'Returned Products' },
    { id: 'exchange', label: 'Exchange Requests' },
    { id: 'refund_processing', label: 'Refund Processing' },
    { id: 'refund_completed', label: 'Refund Completed' },
  ];

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await sellerService.getReturns(params);
      const list = res.data?.returns || (Array.isArray(res.data) ? res.data : []);
      const count = res.data?.totalCount || list.length;
      setReturns(list);
      setTotalCount(count);
    } catch (err) {
      toast.error('Failed to load customer returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [selectedStatus, page]);

  const handleDecision = async (id, decision) => {
    if (decision === 'rejected' && !decisionNotes.trim()) {
      toast.error('A mandatory rejection reason is required');
      return;
    }

    setSubmitting(true);
    try {
      await sellerService.processReturn(id, {
        decision,
        reason: decision === 'rejected' ? `${rejectReason} - ${decisionNotes}` : decisionNotes,
        notes: decisionNotes,
      });

      toast.success(`Return request marked as ${decision.replace(/_/g, ' ')}!`);
      setSelectedReturn(null);
      setDecisionNotes('');
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update return decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Returns & Refund Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Reverse Logistics
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review buyer claims, inspect condition notes, approve reverse pickups, and process refunds.
          </p>
        </div>

        <button
          onClick={fetchReturns}
          disabled={loading}
          className="p-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 8 Status Submenus */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {returnTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-700/20'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReturns()}
            placeholder="Search return requests by sub-order, customer name, mobile or return reason..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => {
            setPage(1);
            fetchReturns();
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
        >
          Search
        </button>
      </div>

      {/* Returns Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-500 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Sub-Order #</th>
                <th className="py-4 px-4">Customer Details</th>
                <th className="py-4 px-4">Product Details</th>
                <th className="py-4 px-4">Reason for Return</th>
                <th className="py-4 px-4 text-right">Refund Amount</th>
                <th className="py-4 px-4">Return Status</th>
                <th className="py-4 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {returns.length > 0 ? (
                returns.map((ret) => {
                  const firstItem = ret.items?.[0] || {};
                  const refundAmt = ret.returnDetails?.refundAmount || ret.subtotal || 0;

                  return (
                    <tr
                      key={ret._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Sub-Order # & Date */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-gray-900 dark:text-white block">
                          {ret.subOrderNumber || ret.orderNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {new Date(ret.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {ret.customerName}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono block mt-0.5">
                          {ret.customerPhone || 'N/A'}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              firstItem.image ||
                              firstItem.product?.images?.[0] ||
                              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                            }
                            alt="product"
                            className="w-9 h-9 rounded-xl object-cover bg-gray-100 border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {firstItem.name || 'Artisan Product'}
                            </p>
                            <span className="text-[10px] text-gray-400 block">
                              Qty: {firstItem.quantity || 1}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Return Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {ret.returnDetails?.reason || ret.returnReason || 'Product size mismatch'}
                        </p>
                      </td>

                      {/* Refund Amount */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-gray-900 dark:text-white">
                        ₹{refundAmt.toLocaleString('en-IN')}
                      </td>

                      {/* Return Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ret.status || ret.returnStatus} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 font-bold text-purple-700 dark:text-purple-300 text-xs transition-colors shadow-sm"
                        >
                          Review & Action
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-gray-400">
                    <RotateCcw className="w-12 h-12 mx-auto mb-2 opacity-30 text-purple-500" />
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                      No returns in this category
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Reverse logistics requests from customers will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Review & Action Modal */}
      {selectedReturn && (
        <Modal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title={`Return Inspection — ${selectedReturn.subOrderNumber}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs text-gray-800 dark:text-gray-200">
            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-extrabold text-gray-900 dark:text-white">
                  {selectedReturn.customerName} ({selectedReturn.customerPhone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Claimed Reason:</span>
                <span className="font-bold text-rose-600">
                  {selectedReturn.returnDetails?.reason || selectedReturn.returnReason || 'Defective / Size mismatch'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Refund Amount:</span>
                <span className="font-extrabold text-sm text-emerald-600">
                  ₹{(selectedReturn.returnDetails?.refundAmount || selectedReturn.subtotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Rejection Preset if seller intends to reject */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Rejection Grounds (if rejecting)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Product damaged by buyer misuse">Product damaged by buyer misuse</option>
                <option value="Missing original tags and invoice">Missing original packaging/tags</option>
                <option value="Return requested past warranty window">Return requested past 7-day window</option>
                <option value="Incorrect product claim">Item received matches catalog specs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Seller Disposition Remarks (Mandatory if Rejecting)
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter mandatory reasoning for decision..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision(selectedReturn._id, 'rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Reject Return
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision(selectedReturn._id, 'approved')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Approve Return
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision(selectedReturn._id, 'pickup_scheduled')}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Schedule Pickup
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Returns;
