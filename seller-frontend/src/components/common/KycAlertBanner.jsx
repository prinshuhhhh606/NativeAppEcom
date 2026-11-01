import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const KycAlertBanner = () => {
  const { seller, isApproved, isUnderReview, isPendingVerification } = useAuth();

  if (isApproved) return null;

  if (seller?.status === 'rejected') {
    return (
      <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">KYC Verification Rejected</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {seller?.rejectionReason || 'Your submitted business documents did not meet verification criteria. Please resubmit updated details.'}
              </p>
            </div>
          </div>
          <Link
            to="/kyc-verification"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors whitespace-nowrap"
          >
            Update & Resubmit KYC
          </Link>
        </div>
      </div>
    );
  }

  if (isUnderReview) {
    return (
      <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Account Under Compliance Review</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Your GSTIN, PAN, and Bank details are being verified by the Admin compliance desk. Verification usually concludes within 24 business hours.
              </p>
            </div>
          </div>
          <Link
            to="/kyc-verification"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors whitespace-nowrap"
          >
            Check Status
          </Link>
        </div>
      </div>
    );
  }

  if (isPendingVerification) {
    return (
      <div className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Complete Business Verification to Start Selling</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Upload your GSTIN certificate, PAN card, and bank account details so you can publish products and receive orders across India.
              </p>
            </div>
          </div>
          <Link
            to="/kyc-verification"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors whitespace-nowrap"
          >
            Complete KYC Wizard →
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default KycAlertBanner;

