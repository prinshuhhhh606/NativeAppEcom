import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

export const Header = ({ isCollapsed, setIsMobileOpen }) => {
  const { admin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { liveNotifications, unreadCount, markAllAsRead } = useSocket();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-18 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-xl border-b border-indigo-100/70 dark:border-indigo-950/40 transition-all duration-300 flex items-center justify-between px-4 lg:px-8 shadow-sm
        ${isCollapsed ? 'left-20' : 'left-0 lg:left-64'}
      `}>
      {/* Top 2px Rainbow Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 via-pink-500 to-amber-500" />

      {/* Left section: mobile hamburger & search */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition">
          <Menu size={22} />
        </button>

        <div className="relative hidden sm:block w-72 md:w-96">
          <Search className="absolute left-3.5 top-2.5 text-indigo-400 dark:text-indigo-400" size={17} />
          <input
            type="text"
            placeholder="Search orders, sellers, items, pincodes..."
            className="w-full pl-10 pr-12 py-2 bg-indigo-50/50 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-gray-800 dark:text-gray-100 outline-none transition-all placeholder:text-gray-400"
          />
          <span className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 shadow-2xs pointer-events-none">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right section: theme toggle, notifications, profile */}
      <div className="flex items-center space-x-3">
        {/* Real-time Socket Indicator Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-black text-emerald-700 dark:text-emerald-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-Time WebSocket Active</span>
        </div>

        {/* Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-700/60 transition-all shadow-2xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDark ? <Sun size={18} className="text-amber-400 animate-spin-slow" /> : <Moon size={18} />}
        </button>

        {/* Real-time Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-700/60 transition-all relative shadow-2xs">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-pink-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-pink-500/40 ring-2 ring-white dark:ring-slate-900 animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-950/80 py-3 z-50 overflow-hidden ring-1 ring-black/5">
              <div className="px-5 py-3 border-b border-indigo-50 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>Live Event Stream</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500 text-white">
                      Live
                    </span>
                  </h3>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Socket.IO Enterprise Channel
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/60">
                {liveNotifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-gray-400 font-medium">
                    No new system notifications
                  </div>
                ) : (
                  liveNotifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors flex items-start space-x-3">
                      <div className="mt-0.5 w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        {n.type === 'order' ? (
                          <CheckCircle2 size={15} />
                        ) : n.type === 'stock' ? (
                          <AlertTriangle size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin User Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-1.5 pr-3 rounded-2xl bg-gradient-to-r from-gray-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/40 border border-indigo-100/80 dark:border-indigo-950/60 hover:shadow-glow-primary transition-all">
            <div className="relative">
              <img
                src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={admin?.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/50"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black text-gray-900 dark:text-gray-100 leading-tight">
                {admin?.name || 'Super Admin'}
              </p>
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                {admin?.role?.replace('_', ' ') || 'Executive Hub'}
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-950/80 py-2.5 z-50 overflow-hidden ring-1 ring-black/5">
              <div className="px-4 py-3 border-b border-indigo-50 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <p className="text-xs font-black text-gray-900 dark:text-white">
                  {admin?.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {admin?.email}
                </p>
              </div>

              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center space-x-2 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                  <Shield size={14} className="text-indigo-500" />
                  <span className="capitalize">{admin?.role?.replace('_', ' ')} Access</span>
                </div>
              </div>

              <div className="border-t border-indigo-50 dark:border-slate-800 p-2">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 transition-colors">
                  <LogOut size={14} />
                  <span>Sign Out of Master Hub</span>
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

