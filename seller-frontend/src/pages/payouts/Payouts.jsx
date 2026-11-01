import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Building,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Payouts = () => {
  const { seller, refreshProfile, isApproved } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getPayouts();
      setPayouts(res.data.payouts || res.data || []);
    } catch (err) {
      toast.error('Failed to load payout history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    const available = seller?.balance?.available || 0;

    if (!withdrawAmount || withdrawAmount < 500) {
      toast.error('Minimum withdrawal request amount is ₹500');
      return;
    }

    if (withdrawAmount > available) {
      toast.error(`Insufficient available balance! Available: ₹${available.toLocaleString('en-IN')}`);
      return;
    }

    setSubmitting(true);
    try {
      await sellerService.requestPayout(withdrawAmount, notes);
      toast.success(`Withdrawal request for ₹${withdrawAmount.toLocaleString('en-IN')} submitted to Finance!`);
      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      await refreshProfile();
      fetchPayouts();
    } catch (err) {
      toast.error(err.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBal = seller?.balance?.available || 0;
  const pendingBal = seller?.balance?.pending || 0;
  const bank = seller?.bankAccount || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Bank Settlement & Payouts
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automated NEFT / IMPS marketplace settlement directly to your verified bank account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayouts}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!isApproved || availableBal < 500}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            title={
              !isApproved
                ? 'KYC verification required'
                : availableBal < 500
                ? 'Minimum withdrawal is ₹500'
                : ''
            }
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Bank Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Top Cards: Balance & Bank Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available for Withdrawal */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Ready for Withdrawal
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              ₹{availableBal.toLocaleString('en-IN')}
            </h2>
            <p className="mt-1 text-xs text-emerald-100">
              ₹{pendingBal.toLocaleString('en-IN')} pending order deliveries
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-500/40 flex items-center justify-between text-xs">
            <span>Min. Payout: ₹500</span>
            <span>Settlement Cycle: T+2</span>
          </div>
        </div>

        {/* Bank Account Snapshot (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Primary Settlement Bank Account
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Direct credit destination for all marketplace sales payouts
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                <span className="text-gray-400 font-medium">Bank Name</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                  {bank.bankName || 'State Bank of India'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                <span className="text-gray-400 font-medium">Account Number</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {bank.accountNumber || '•••••••• 8821'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                <span className="text-gray-400 font-medium">IFSC Code</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                  {bank.ifscCode || 'SBIN0001234'}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-gray-400">
            Account Holder: <span className="font-bold text-gray-700 dark:text-gray-300">{bank.accountHolderName || seller?.name}</span>
          </p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Payout History & Requests</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track status of bank transfers approved by Bharat Bazaar finance desk
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {payouts.length} Payouts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">Payout ID</th>
                <th className="py-3.5 px-4">Requested On</th>
                <th className="py-3.5 px-4">Withdrawal Amount</th>
                <th className="py-3.5 px-4">Settlement Bank</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Bank UTR / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {payouts.length > 0 ? (
                payouts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-gray-900 dark:text-white">
                      {p.payoutNumber || p._id.slice(-8).toUpperCase()}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-sm text-gray-900 dark:text-white">
                      ₹{(p.amount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <p className="font-semibold">{p.bankDetails?.bankName || bank.bankName || 'Bank'}</p>
                      <p className="text-[10px] font-mono text-gray-400">
                        {p.bankDetails?.accountNumber || bank.accountNumber || '••••'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status || 'pending'} size="sm" />
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                      {p.utrNumber || p.transactionReference || 'In Clearance'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No payout requests submitted yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Once your available balance reaches ₹500, you can request an instant bank withdrawal.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Request Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Request Bank Payout"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                Available for Immediate Withdrawal:
              </span>
              <span className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
                ₹{availableBal.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Withdrawal Amount (Min ₹500) *
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min={500}
                  max={availableBal}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="block w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm"
                />
              </div>
              <div className="mt-1.5 flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAmount(availableBal.toString())}
                  className="font-bold text-emerald-600 hover:underline"
                >
                  Withdraw All (₹{availableBal.toLocaleString('en-IN')})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Beneficiary Destination Account
              </label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                <p className="font-bold text-gray-900 dark:text-white">{bank.bankName || 'SBI'}</p>
                <p className="font-mono text-gray-500">
                  {bank.accountNumber || '•••• 8821'} • IFSC: {bank.ifscCode || 'SBIN0001234'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Remarks / Reference Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. October month settlement"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Bank Transfer Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Payouts;

