import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Camera,
  FileCheck,
  History,
  Lock,
  RefreshCw,
  Plus,
  ExternalLink,
  Laptop,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

export const Protection = () => {
  const [disputes, setDisputes] = useState([]);
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: '',
    type: 'return_abuse',
    reason: '',
    description: '',
    claimAmount: '',
    evidenceUrl: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dispRes, secRes] = await Promise.all([
        sellerService.getDisputes(),
        sellerService.getSecurityOverview(),
      ]);
      setDisputes(dispRes.data || []);
      setSecurityData(secRes.data || null);
    } catch (err) {
      toast.error('Failed to load protection center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.reason || !formData.description) {
      toast.error('Please enter order reference, reason, and detailed explanation');
      return;
    }

    try {
      await sellerService.createDispute({
        ...formData,
        evidenceFiles: formData.evidenceUrl ? [formData.evidenceUrl.trim()] : [],
        claimAmount: parseFloat(formData.claimAmount) || 0,
      });
      toast.success('Protection claim filed! Bharat Bazaar Trust Cell is investigating.');
      setIsDisputeModalOpen(false);
      setFormData({
        orderNumber: '',
        type: 'return_abuse',
        reason: '',
        description: '',
        claimAmount: '',
        evidenceUrl: '',
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to file claim');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Seller Protection & Trust Center</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Safeguard your store against fraudulent returns, delivery tampering, unboxing disputes, and unauthorized logins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Security Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsDisputeModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>File Protection Claim</span>
          </button>
        </div>
      </div>

      {/* Gold Shield Guarantee Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
              Active Security Tier
            </span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Bharat Bazaar Gold Merchant Shield
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              100% Transit Loss Compensation • Courier Non-Delivery Reimbursement • Return Abuse Fraud Prevention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-amber-200 dark:border-slate-700 shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Store Trust Score</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {securityData?.performanceScore || '98.4'}%
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

      {/* Two Column Layout: Claims Table + Login Security */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Disputes & Claims List (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Filed Protection Disputes ({disputes.length})
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Claims undergoing review by the Bharat Bazaar Merchant Protection Council
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Dispute Type</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Claim (INR)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
                      <span>Loading claims...</span>
                    </td>
                  </tr>
                ) : disputes.length > 0 ? (
                  disputes.map((d) => (
                    <tr key={d._id} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        {d.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-[10px] font-bold">
                          {d.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200 max-w-xs truncate">
                        {d.reason}
                      </td>
                      <td className="py-3.5 px-4 font-black text-gray-900 dark:text-white">
                        ₹{d.claimAmount?.toLocaleString('en-IN') || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            d.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : d.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Zero Open Disputes
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Your store currently has a clean compliance and fulfillment safety record.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Device Logins & Security (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Login & Device Security</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {(securityData?.loginHistory || []).map((sess, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      {sess.device.includes('Android') ? (
                        <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span>{sess.device}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {sess.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    IP: {sess.ip} • {sess.location}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(sess.date).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* File Dispute Claim Modal */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="File Seller Protection Claim"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Sub-Order Number *
            </label>
            <input
              type="text"
              required
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. BBIN-261031-7711"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Claim Category *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
            >
              <option value="return_abuse">Return Abuse (Empty Box / Used Item Returned)</option>
              <option value="delivery_dispute">Delivery Dispute (Courier Lost in Transit)</option>
              <option value="damage_claim">Transit Physical Damage Claim</option>
              <option value="suspicious_order">Suspicious Buyer Pattern Flag</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Dispute Title / Reason *
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Customer returned counterfeit substitute product"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Claim Compensation Amount (INR)
            </label>
            <input
              type="number"
              value={formData.claimAmount}
              onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
              placeholder="1299"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Unboxing / CCTV Photo Evidence URL
            </label>
            <input
              type="url"
              value={formData.evidenceUrl}
              onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
              placeholder="https://... (Photo or Video URL of unboxing/packaging)"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Detailed Circumstances *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe package condition upon delivery, security seals, weight discrepancy..."
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDisputeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Submit Dispute
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Protection;

