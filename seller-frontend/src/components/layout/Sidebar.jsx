import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  CircleDollarSign,
  CreditCard,
  Star,
  BarChart3,
  FileCheck2,
  Settings,
  LogOut,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { seller, logout, isApproved } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Product Catalog', path: '/products', icon: Package },
    { label: 'Inventory Stock', path: '/inventory', icon: Boxes },
    { label: 'Orders & Shipping', path: '/orders', icon: ShoppingBag },
    { label: 'Returns & Refunds', path: '/returns', icon: RotateCcw },
    { label: 'Earnings & Ledger', path: '/earnings', icon: CircleDollarSign },
    { label: 'Bank Payouts', path: '/payouts', icon: CreditCard },
    { label: 'Customer Reviews', path: '/reviews', icon: Star },
    { label: 'Analytics Reports', path: '/reports', icon: BarChart3 },
    { label: 'KYC Verification', path: '/kyc-verification', icon: FileCheck2 },
    { label: 'Store Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-100 dark:border-slate-800/80">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                BHARAT BAZAAR
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Seller Central
            </span>
          </div>
        </div>

        {/* Store Card Snapshot */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Store Profile</span>
            <StatusBadge status={seller?.status || 'pending_verification'} size="sm" />
          </div>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">
            {seller?.storeName || seller?.businessName || 'My Store'}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Commission: {seller?.commissionRate || 10}%</span>
            <span>Bal: ₹{(seller?.balance?.available || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/80">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out Partner</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

