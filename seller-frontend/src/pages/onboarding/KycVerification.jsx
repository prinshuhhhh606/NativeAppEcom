import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Upload,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export const KycVerification = () => {
  const { seller, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('tax'); // 'business' | 'tax' | 'bank'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    storeName: '',
    businessType: 'proprietorship',
    businessDescription: '',
    address: {
      street: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
    },
    panNumber: '',
    gstin: '',
    kycDocuments: {
      panCardImage: '',
      gstCertificate: '',
      addressProof: '',
      cancelledCheque: '',
    },
    bankAccount: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
    },
  });

  useEffect(() => {
    if (seller) {
      setFormData({
        businessName: seller.businessName || '',
        storeName: seller.storeName || '',
        businessType: seller.businessType || 'proprietorship',
        businessDescription: seller.businessDescription || '',
        address: {
          street: seller.address?.street || '',
          city: seller.address?.city || '',
          state: seller.address?.state || '',
          pinCode: seller.address?.pinCode || '',
          country: seller.address?.country || 'India',
        },
        panNumber: seller.panNumber || '',
        gstin: seller.gstin || '',
        kycDocuments: {
          panCardImage: seller.kycDocuments?.panCardImage || '',
          gstCertificate: seller.kycDocuments?.gstCertificate || '',
          addressProof: seller.kycDocuments?.addressProof || '',
          cancelledCheque: seller.kycDocuments?.cancelledCheque || '',
        },
        bankAccount: {
          accountHolderName: seller.bankAccount?.accountHolderName || '',
          accountNumber: seller.bankAccount?.accountNumber || '',
          ifscCode: seller.bankAccount?.ifscCode || '',
          bankName: seller.bankAccount?.bankName || '',
          branchName: seller.bankAccount?.branchName || '',
        },
      });
    }
  }, [seller]);

  const handleSaveKyc = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await sellerService.updateKyc(formData);
      toast.success('KYC details saved successfully!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update KYC details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      // First save current form data
      await sellerService.updateKyc(formData);
      // Then submit for verification review
      const res = await sellerService.submitForReview();
      toast.success(res.message || 'Documents submitted for compliance verification!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = seller?.status === 'under_review' || seller?.status === 'approved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seller KYC & Verification</h1>
              <StatusBadge status={seller?.status || 'pending_verification'} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Statutory verification compliant with GST, PAN, and RBI marketplace settlement guidelines.
            </p>
          </div>
        </div>

        {!isLocked && (
          <button
            onClick={handleSubmitForReview}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Admin Approval →'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 space-x-6">
        <button
          onClick={() => setActiveTab('tax')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tax'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          1. Tax Identity (PAN & GSTIN)
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bank'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          2. Bank Settlement Account
        </button>

        <button
          onClick={() => setActiveTab('business')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'business'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Building className="w-4 h-4" />
          3. Pickup & Warehouse Address
        </button>
      </div>

      {/* Tab 1: Tax Identity */}
      {activeTab === 'tax' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Permanent Account Number (PAN) *
              </label>
              <input
                type="text"
                maxLength={10}
                disabled={isLocked}
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. ABCDE1234F"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono uppercase text-sm disabled:opacity-60"
              />
              <p className="text-[11px] text-gray-400 mt-1">10-character alphanumeric PAN issued by IT Dept.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                GSTIN (Goods and Services Tax ID)
              </label>
              <input
                type="text"
                maxLength={15}
                disabled={isLocked}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 08ABCDE1234F1Z5"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono uppercase text-sm disabled:opacity-60"
              />
              <p className="text-[11px] text-gray-400 mt-1">15-digit state-coded GST identification number.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-gray-100 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                PAN Card Proof Document URL / Image
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.kycDocuments.panCardImage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kycDocuments: { ...formData.kycDocuments, panCardImage: e.target.value },
                  })
                }
                placeholder="https://..."
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                GST Certificate Document URL / Image
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.kycDocuments.gstCertificate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kycDocuments: { ...formData.kycDocuments, gstCertificate: e.target.value },
                  })
                }
                placeholder="https://..."
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs disabled:opacity-60"
              />
            </div>
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveKyc}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors"
              >
                {loading ? 'Saving...' : 'Save Tax Info'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bank Settlement Account */}
      {activeTab === 'bank' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Bank Beneficiary Name (Account Holder) *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.bankAccount.accountHolderName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, accountHolderName: e.target.value },
                  })
                }
                placeholder="e.g. Rajesh Sharma"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Bank Name *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.bankAccount.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, bankName: e.target.value },
                  })
                }
                placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Bank Account Number *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.bankAccount.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, accountNumber: e.target.value },
                  })
                }
                placeholder="Account number for NEFT/IMPS settlements"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                IFSC Code (11 Digits) *
              </label>
              <input
                type="text"
                maxLength={11}
                disabled={isLocked}
                value={formData.bankAccount.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                placeholder="e.g. SBIN0001234"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono uppercase text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Cancelled Cheque / Bank Passbook Photo URL
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.kycDocuments.cancelledCheque}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kycDocuments: { ...formData.kycDocuments, cancelledCheque: e.target.value },
                })
              }
              placeholder="https://..."
              className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs disabled:opacity-60"
            />
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveKyc}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors"
              >
                {loading ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pickup & Warehouse Address */}
      {activeTab === 'business' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Street / Building / Area (Courier Pickup Location) *
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={formData.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              placeholder="Shop No. / Plot / Road name"
              className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                City / District *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                placeholder="e.g. Jaipur"
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                State *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                placeholder="e.g. Rajasthan"
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                PIN Code (6 Digits) *
              </label>
              <input
                type="text"
                maxLength={6}
                disabled={isLocked}
                value={formData.address.pinCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, pinCode: e.target.value },
                  })
                }
                placeholder="e.g. 302003"
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono text-sm disabled:opacity-60"
              />
            </div>
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveKyc}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-colors"
              >
                {loading ? 'Saving...' : 'Save Pickup Address'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KycVerification;

