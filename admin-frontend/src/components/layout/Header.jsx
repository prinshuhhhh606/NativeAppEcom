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
      className={`fixed top-0 right-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-4 lg:px-8
        ${isCollapsed ? 'left-20' : 'left-0 lg:left-64'}
      `}>
      {/* Left section: mobile hamburger & search */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <Menu size={22} />
        </button>

        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 outline-none"
          />
        </div>
      </div>

      {/* Right section: theme toggle, notifications, profile */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
        </button>

        {/* Real-time Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative">
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-3 z-50">
              <div className="px-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Live Notifications
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Real-time Socket.IO Stream
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
                {liveNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No new notifications
                  </div>
                ) : (
                  liveNotifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors flex items-start space-x-3">
                      <div className="mt-0.5">
                        {n.type === 'order' ? (
                          <CheckCircle2 className="text-emerald-500" size={16} />
                        ) : n.type === 'stock' ? (
                          <AlertTriangle className="text-amber-500" size={16} />
                        ) : (
                          <Clock className="text-blue-500" size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <img
              src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={admin?.name}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">
                {admin?.name || 'Super Admin'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                {admin?.role?.replace('_', ' ') || 'Administrator'}
              </p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {admin?.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {admin?.email}
                </p>
              </div>

              <div className="py-1">
                <div className="px-4 py-2 text-xs text-gray-500 flex items-center space-x-2">
                  <Shield size={14} className="text-blue-500" />
                  <span className="capitalize">{admin?.role?.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center space-x-2 transition-colors">
                  <LogOut size={14} />
                  <span>Sign Out</span>
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

