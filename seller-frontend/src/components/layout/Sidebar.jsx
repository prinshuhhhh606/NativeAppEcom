import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Truck,
  RotateCcw,
  CircleDollarSign,
  CreditCard,
  Star,
  BarChart3,
  FileCheck2,
  Settings,
  LogOut,
  Store,
  Users,
  Receipt,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../common/StatusBadge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { seller, logout, isApproved } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navSections = [
    {
      heading: 'CORE MANAGEMENT',
      links: [
        { label: t('dashboard') || 'Dashboard', path: '/', icon: LayoutDashboard, iconColor: 'text-blue-500' },
        { label: t('products') || 'Products', path: '/products', icon: Package, iconColor: 'text-purple-500' },
        { label: t('inventory') || 'Inventory', path: '/inventory', icon: Boxes, iconColor: 'text-amber-500' },
        { label: t('orders') || 'Orders', path: '/orders', icon: ShoppingBag, iconColor: 'text-indigo-500' },
        { label: 'Shipping & Logistics', path: '/shipping', icon: Truck, iconColor: 'text-cyan-500' },
        { label: t('returns') || 'Returns & NDR', path: '/returns', icon: RotateCcw, iconColor: 'text-orange-500' },
      ],
    },
    {
      heading: 'FINANCES & REVENUE',
      links: [
        { label: t('accounting') || 'GST & Accounting', path: '/accounting', icon: Receipt, iconColor: 'text-emerald-500' },
        { label: t('earnings') || 'Earnings', path: '/earnings', icon: CircleDollarSign, iconColor: 'text-emerald-600' },
        { label: t('payouts') || 'Bank Payouts', path: '/payouts', icon: CreditCard, iconColor: 'text-purple-600' },
        { label: t('analytics') || 'Sales Analytics', path: '/reports', icon: BarChart3, iconColor: 'text-blue-600' },
      ],
    },
    {
      heading: 'GROWTH & TEAM',
      links: [
        { label: t('growth') || 'Growth & Ads', path: '/growth', icon: Sparkles, iconColor: 'text-amber-500' },
        { label: t('staff') || 'Staff & Roles', path: '/staff', icon: Users, iconColor: 'text-blue-500' },
        { label: t('protection') || 'Store Protection', path: '/protection', icon: ShieldCheck, iconColor: 'text-emerald-500' },
        { label: t('reviews') || 'Reviews', path: '/reviews', icon: Star, iconColor: 'text-yellow-500' },
      ],
    },
    {
      heading: 'CONFIG & COMPLIANCE',
      links: [
        { label: t('settings') || 'Store Settings', path: '/settings', icon: Settings, iconColor: 'text-slate-500' },
        { label: t('help') || 'Help & Support', path: '/help', icon: HelpCircle, iconColor: 'text-blue-500' },
      ],
    },
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 px-6 h-20 border-b border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                BHARAT BAZAAR
              </span>
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-gradient-primary">
              Seller Studio Pro
            </span>
          </div>
        </div>

        {/* Store Profile Card Snapshot */}
        <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Merchant Store
            </span>
            <StatusBadge status={seller?.status || 'pending_verification'} size="sm" />
          </div>
          <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {seller?.storeName || seller?.businessName || 'My Store'}
          </p>
          <div className="mt-2 pt-2 border-t border-blue-100/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span>Rate: {seller?.commissionRate || 10}%</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ₹{(seller?.balance?.available || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {sec.heading}
              </span>
              <div className="mt-1 space-y-0.5">
                {sec.links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-blue-600/25'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                isActive ? 'text-white' : item.iconColor
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all border border-rose-100 dark:border-rose-900/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Seller Studio</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
