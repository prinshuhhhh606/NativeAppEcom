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
  Sparkles,
  Zap,
  Building2,
  Navigation,
  Coins,
  Wallet,
  LifeBuoy,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-400', badge: 'Live' },
  { name: 'Orders Hub', path: '/orders', icon: ShoppingBag, gradient: 'from-indigo-500 to-blue-600' },
  { name: 'Products Catalog', path: '/products', icon: Package, gradient: 'from-purple-500 to-indigo-600' },
  { name: 'Categories', path: '/categories', icon: Layers, gradient: 'from-fuchsia-500 to-pink-500' },
  { name: 'Stock & Inventory', path: '/inventory', icon: Boxes, gradient: 'from-amber-500 to-orange-500' },
  { name: 'Vendors / Sellers', path: '/sellers', icon: Store, gradient: 'from-emerald-500 to-teal-500', badge: 'KYC' },
  { name: 'Franchise Hub', path: '/franchises', icon: Building2, gradient: 'from-violet-500 to-purple-600', badge: 'Area' },
  { name: 'Delivery Fleet', path: '/delivery-partners', icon: Bike, gradient: 'from-cyan-500 to-teal-400', badge: 'Riders' },
  { name: 'Live Fleet Radar', path: '/live-deliveries', icon: Navigation, gradient: 'from-sky-400 to-blue-600', badge: 'GPS' },
  { name: 'Customers', path: '/customers', icon: Users, gradient: 'from-pink-500 to-rose-500' },
  { name: 'Commissions', path: '/commissions', icon: Coins, gradient: 'from-amber-400 to-yellow-600' },
  { name: 'Payout Settlements', path: '/payouts', icon: Wallet, gradient: 'from-emerald-600 to-teal-600', badge: 'Bank' },
  { name: 'Support & Grievance', path: '/support', icon: LifeBuoy, gradient: 'from-rose-500 to-red-600', badge: 'Help' },
  { name: 'Broadcast Alerts', path: '/notifications', icon: Megaphone, gradient: 'from-indigo-600 to-pink-500' },
  { name: 'Coupons & Deals', path: '/coupons', icon: TicketPercent, gradient: 'from-orange-500 to-amber-500' },
  { name: 'Payments & Gateway', path: '/payments', icon: CreditCard, gradient: 'from-teal-500 to-emerald-600' },
  { name: 'Shipping & Zones', path: '/shipping', icon: Truck, gradient: 'from-sky-500 to-indigo-500' },
  { name: 'Returns & Disputes', path: '/returns', icon: RotateCcw, gradient: 'from-rose-500 to-pink-600' },
  { name: 'Customer Reviews', path: '/reviews', icon: Star, gradient: 'from-yellow-400 to-amber-500' },
  { name: 'Financial Reports', path: '/reports', icon: BarChart3, gradient: 'from-blue-600 to-purple-600' },
  { name: 'Platform Settings', path: '/settings', icon: Settings, gradient: 'from-slate-500 to-slate-700' },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { admin } = useAuth();
  const { isConnected } = useSocket();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl border-r border-indigo-100/60 dark:border-indigo-950/40 flex flex-col justify-between shadow-2xl shadow-indigo-500/5 dark:shadow-none
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        <div>
          {/* Brand Logo Header */}
          <div className="h-18 flex items-center justify-between px-4 py-4 border-b border-indigo-50/80 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 shrink-0 ring-2 ring-white/50 dark:ring-white/10">
                  BB
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-black text-base tracking-tight text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>Bharat Bazaar</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
                    <Zap size={10} className="text-amber-500" />
                    Master Admin Suite
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition">
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow-primary ring-1 ring-white/30'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50/60 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}>
                  {({ isActive }) => (
                    <>
                      {/* Left glowing border bar on active */}
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-300 shadow-sm" />
                      )}

                      {/* Icon with vivid gradient box */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                          isCollapsed ? 'mx-auto' : 'mr-3'
                        } ${
                          isActive
                            ? 'bg-white/20 text-white ring-1 ring-white/30'
                            : `bg-gradient-to-tr ${item.gradient} text-white shadow-md`
                        }`}>
                        <Icon size={15} />
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="tracking-tight">{item.name}</span>
                          {item.badge && !isActive && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Real-Time Socket Connection Pill & Role Indicator */}
        <div className="p-3 border-t border-indigo-50/80 dark:border-slate-800/80 bg-gradient-to-t from-indigo-50/40 via-purple-50/20 to-transparent dark:from-indigo-950/20 dark:to-transparent">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } px-3 py-2 rounded-2xl bg-white dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-950/60 text-xs shadow-sm`}>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              {!isCollapsed && (
                <span className="font-extrabold text-gray-800 dark:text-gray-200 text-[11px] flex items-center gap-1">
                  <span>{isConnected ? 'Socket.IO Online' : 'Offline'}</span>
                </span>
              )}
            </div>

            {!isCollapsed && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                {admin?.role?.replace('_', ' ') || 'Super Admin'}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
