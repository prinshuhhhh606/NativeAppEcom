import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState(null); // { type: 'pending'|'rejected'|'suspended'|'error', title, message, reason }
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setApprovalNotice(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      const status = res.status;
      if (status === 'pending' || status === 'under_review' || status === 'pending_verification') {
        setApprovalNotice({
          type: 'pending',
          title: 'Account Waiting for Admin Approval',
          message:
            res.message ||
            'Your account is waiting for Admin approval. Once approved, you will have immediate access to your Seller Central dashboard.',
        });
      } else if (status === 'rejected') {
        setApprovalNotice({
          type: 'rejected',
          title: 'Seller Application Rejected',
          message:
            res.message ||
            'Your seller account has been rejected by Admin.',
          reason: res.rejectionReason,
        });
      } else if (status === 'suspended' || status === 'blocked') {
        setApprovalNotice({
          type: 'suspended',
          title: 'Account Suspended',
          message:
            res.message ||
            'Your seller account has been suspended by the administrator. Please contact support.',
        });
      } else {
        setApprovalNotice({
          type: 'error',
          title: 'Login Failed',
          message: res.message || 'Invalid vendor email or password. Please try again.',
        });
      }
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setApprovalNotice(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 ring-4 ring-white/10">
            <Store className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          Bharat Bazaar Seller Central
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200/80">
          Pan-India Multi-Vendor Portal & Logistics Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 dark:border-slate-800">
          {/* Status-specific warning banners */}
          {approvalNotice && (
            <div className="mb-5">
              {approvalNotice.type === 'pending' && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0">
                      <Clock className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        {approvalNotice.title}
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                        {approvalNotice.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {approvalNotice.type === 'rejected' && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 mt-0.5 shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
                        {approvalNotice.title}
                      </h4>
                      <p className="text-xs text-rose-800 dark:text-rose-300/90 mt-1 leading-relaxed">
                        {approvalNotice.message}
                      </p>
                      {approvalNotice.reason && (
                        <div className="mt-2 text-xs font-semibold text-rose-950 dark:text-rose-200 bg-rose-100/80 dark:bg-rose-900/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                          Reason: {approvalNotice.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {approvalNotice.type === 'suspended' && (
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mt-0.5 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                        {approvalNotice.title}
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        {approvalNotice.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {approvalNotice.type === 'error' && (
                <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3.5 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{approvalNotice.message}</span>
                </div>
              )}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Registered Vendor Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@appecom.in"
                  className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-150"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Seller Central</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
              1-Click Demo Credentials
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoFill('seller@appecom.in', 'Seller@12345')}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                      Approved Seller (Jaipur Handlooms)
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    seller@appecom.in • Full catalog, orders & dashboard
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                  Use
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Want to sell on Bharat Bazaar?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Register as New Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
