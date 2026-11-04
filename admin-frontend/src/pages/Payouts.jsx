import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Store,
  Bike,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  DollarSign,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Payouts = () => {
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' | 'delivery'
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionStatus, setActionStatus] = useState('completed');

  useEffect(() => {
    fetchPayouts();
  }, [activeTab, statusFilter]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'sellers' ? '/payouts' : '/delivery-payouts';
      const res = await api.get(`${endpoint}?status=${statusFilter}`);
      const list = res.data?.payouts || res.data || [];
      setPayouts(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      const endpoint =
        activeTab === 'sellers'
          ? `/payouts/${selectedPayout._id}/status`
          : `/delivery-payouts/${selectedPayout._id}/status`;

      await api.patch(endpoint, {
        status: actionStatus,
        referenceNumber,
        adminRemarks,
      });

      toast.success(`Payout ${actionStatus} successfully`);
      setProcessModalOpen(false);
      setSelectedPayout(null);
      setReferenceNumber('');
      setAdminRemarks('');
      fetchPayouts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payout');
    }
  };

  const pendingCount = payouts.filter((p) => p.status === 'pending' || p.status === 'requested').length;
  const completedTotal = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="text-emerald-500" />
            Payout Disbursement & Settlement Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review, approve, and disburse bank settlements to sellers and fleet delivery partners
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Pending Payout Requests</span>
            <Clock className="text-amber-500" size={18} />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{pendingCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Completed Disbursements</span>
            <CheckCircle className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{completedTotal.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Disbursement Method</span>
            <CreditCard className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">NEFT / IMPS / UPI</p>
        </div>
      </div>

      {/* Party Switch Tabs (Sellers vs Delivery Fleet) */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition ${
            activeTab === 'sellers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Store size={18} />
          Seller Merchant Payouts
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition ${
            activeTab === 'delivery'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Bike size={18} />
          Delivery Partner Payouts
        </button>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Bank / UPI Destination</th>
                <th className="py-3.5 px-4">Request Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">UTR Reference</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    Loading payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No payout requests in this queue.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const recipient = p.seller || p.deliveryPartner || {};
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {recipient.storeName || recipient.name || 'Recipient'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{recipient.phone || recipient.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-700 dark:text-gray-300 block font-mono">
                          {p.bankAccount?.accountNumber ? `A/C: ••••${p.bankAccount.accountNumber.slice(-4)}` : p.upiId || 'Direct Wallet'}
                        </span>
                        <span className="text-[11px] text-gray-400 block">{p.bankAccount?.ifscCode || p.bankAccount?.bankName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {p.referenceNumber || 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.status === 'pending' || p.status === 'requested' ? (
                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setActionStatus('completed');
                              setReferenceNumber(`UTR${Date.now()}`);
                              setProcessModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition">
                            Process
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Processing Modal */}
      {processModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B0F19] rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Process Payout Disbursement</h2>
            <p className="text-xs text-gray-500 mb-4">
              Disburse ₹{(selectedPayout.amount || 0).toLocaleString('en-IN')} to recipient.
            </p>

            <form onSubmit={handleProcessSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Action Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                  <option value="completed">Complete & Disbursed (Approved)</option>
                  <option value="rejected">Reject & Refund to Wallet</option>
                </select>
              </div>

              {actionStatus === 'completed' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Bank UTR / Transaction Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UTR1289381928"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Optional verification note..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProcessModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payouts;

