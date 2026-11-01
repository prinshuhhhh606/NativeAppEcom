import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Boxes,
  Users,
  TicketPercent,
  CreditCard,
  Truck,
  RotateCcw,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Store,
  Bike,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Orders', path: '/orders', icon: ShoppingBag },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Categories', path: '/categories', icon: Layers },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Vendors / Sellers', path: '/sellers', icon: Store },
  { name: 'Delivery Fleet', path: '/delivery-partners', icon: Bike },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Coupons', path: '/coupons', icon: TicketPercent },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Shipping', path: '/shipping', icon: Truck },
  { name: 'Returns', path: '/returns', icon: RotateCcw },
  { name: 'Reviews', path: '/reviews', icon: Star },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { admin } = useAuth();
  const { isConnected } = useSocket();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                BB
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white leading-tight">
                    Bharat Bazaar
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800">
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}>
                  <Icon
                    size={20}
                    className={`${isCollapsed ? 'mx-auto' : 'mr-3'} shrink-0`}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Real-Time Socket Connection Pill & Role Indicator */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-800">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } px-2 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 text-xs`}>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {!isCollapsed && (
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {isConnected ? 'Real-Time Sync' : 'Offline'}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                {admin?.role?.replace('_', ' ') || 'Admin'}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

