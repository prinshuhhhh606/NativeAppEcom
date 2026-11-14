import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Store,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav = ({ onOpenMenu }) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'home',
      label: t('dashboard') || 'Home',
      path: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      id: 'products',
      label: t('products') || 'Products',
      path: '/products',
      icon: Package,
    },
    {
      id: 'orders',
      label: t('orders') || 'Orders',
      path: '/orders',
      icon: ShoppingBag,
    },
    {
      id: 'earnings',
      label: t('earnings') || 'Earnings',
      path: '/earnings',
      icon: Wallet,
    },
    {
      id: 'profile',
      label: t('profile') || 'Profile',
      path: '/settings',
      icon: Store,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] select-none pb-[env(safe-area-inset-bottom,0px)]"
      role="navigation"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `group relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1.5 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-200 group-active:scale-90" />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight transition-colors truncate max-w-[64px] ${
                      isActive
                        ? 'font-extrabold text-blue-600 dark:text-blue-400'
                        : 'font-semibold text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

