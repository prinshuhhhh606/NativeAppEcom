import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, User, CheckCircle, ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom';

export const Header = ({ onOpenSidebar }) => {
  const { seller, logout, isApproved } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected, unreadCount } = useSocket();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
      {/* Left: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-gray-500 rounded-xl lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {seller?.storeName || 'Vendor Dashboard'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {isConnected ? 'Real-Time Sync Active' : 'Connecting Sync...'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Color Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2.5 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {seller?.storeLogo ? (
              <img
                src={seller.storeLogo}
                alt={seller.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {(seller?.name || 'V').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                {seller?.name || 'Vendor Partner'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight truncate max-w-[120px]">
                {seller?.email}
              </p>
            </div>
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl border border-gray-100 dark:border-slate-700"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{seller?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{seller?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/60"
                >
                  <User className="w-4 h-4" />
                  Store Settings
                </Link>
                <Link
                  to="/kyc-verification"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  KYC & Documents
                </Link>
              </div>

              <div className="pt-1 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

