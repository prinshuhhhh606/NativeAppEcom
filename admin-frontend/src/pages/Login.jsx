import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('admin@appecom.in');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Vibrant Aurora Mesh Background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-tr from-pink-600/25 to-cyan-500/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] h-[22rem] bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-indigo-100 dark:border-indigo-950/80 p-8 sm:p-10 relative z-10 ring-1 ring-white/20">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/40 ring-4 ring-white/50 dark:ring-white/10">
              BB
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
            <Zap size={11} className="text-amber-500" />
            <span>Master Enterprise Portal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Bharat Bazaar
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Pan-India Multi-Vendor Operations & Governance Suite
          </p>
        </div>

        {/* Server Error Alert Banner */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Admin Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-indigo-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@appecom.in"
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/40 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700/80 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-indigo-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-indigo-50/40 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700/80 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Authorize & Enter Master Hub</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Fillers with Colorful Badges */}
        <div className="mt-8 pt-6 border-t border-indigo-50 dark:border-slate-800 text-center">
          <p className="text-[11px] text-gray-400 mb-3 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <KeyRound size={12} className="text-amber-500" />
            <span>Instant Demo Fill</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@appecom.in', 'Admin@12345')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-200/80 dark:border-blue-900/60 text-xs font-bold text-blue-700 dark:text-blue-300 transition-all shadow-2xs">
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('manager@appecom.in', 'Manager@12345')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 border border-purple-200/80 dark:border-purple-900/60 text-xs font-bold text-purple-700 dark:text-purple-300 transition-all shadow-2xs">
              🛡️ Operations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
