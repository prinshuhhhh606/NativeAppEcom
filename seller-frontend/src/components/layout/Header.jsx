import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  User,
  CheckCircle,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Languages,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom';

export const Header = ({ onOpenSidebar }) => {
  const { seller, logout, isApproved } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLanguage } = useLanguage();
  const { isConnected, unreadCount } = useSocket();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 lg:h-20 px-3 sm:px-6 lg:px-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs select-none">
      {/* Left: Mobile Drawer Trigger & Store Identity */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 rounded-xl lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-xs md:max-w-none">
              {seller?.storeName || 'Merchant Studio'}
            </h2>
            {isApproved && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[9px] sm:text-[10px] font-extrabold text-blue-600 dark:text-blue-400 flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
                <span className="hidden xs:inline">Verified</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {isConnected ? 'Live Sync' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2.5">
        {/* Bilingual Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs"
          title="Switch Language / भाषा बदलें"
        >
          <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] sm:text-xs">{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2.5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          title="Toggle Color Theme"
        >
          {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
        </button>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-1.5 sm:p-2.5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] sm:h-4 sm:min-w-[16px] px-0.5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {seller?.storeLogo ? (
              <img
                src={seller.storeLogo}
                alt={seller.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20">
                {(seller?.name || 'V').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                {seller?.name || 'Store Merchant'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {seller?.email || 'seller@appecom.in'}
              </p>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 z-40 w-64 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-card-hover border border-slate-100 dark:border-slate-800 p-2 text-xs font-semibold space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                  <p className="font-extrabold text-slate-900 dark:text-white">{seller?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{seller?.email}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                    <span>Store ID</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {seller?._id ? seller._id.slice(-6).toUpperCase() : 'STORE'}
                    </span>
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Store Profile & Settings</span>
                </Link>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center w-full gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
