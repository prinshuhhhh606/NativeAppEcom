import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  RotateCcw,
  CheckCircle,
  Truck,
  Layers,
  ChevronRight,
  Sparkles,
  Store,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Bike,
  Zap,
  Activity,
  CreditCard,
  Flame,
  Award,
  Building2,
  Percent,
  Coins,
  Wallet,
  XCircle,
  UserCheck,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Dashboard = () => {
  const { admin } = useAuth();
  const { isConnected } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  const filterTypeMap = {
    today: 'daily',
    '7d': 'weekly',
    '30d': 'monthly',
    '1y': 'yearly',
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [timeframe]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const ft = filterTypeMap[timeframe] || 'monthly';
      const res = await api.get(`/dashboard?timeframe=${timeframe}&filterType=${ft}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const overview = data?.overview || {};
  const analytics = data?.analytics || {};
  const recentOrders = data?.recentOrders || [];
  const lowStockList = data?.lowStockList || [];
  const liveActiveDeliveries = data?.liveActiveDeliveries || [];
  const topSellers = analytics?.topSellers || [];
  const bestSellers = analytics?.bestSellers || [];

  // 18 Master Prompt Overview Cards grouped by functional pillars
  const financialCards = [
    {
      title: 'Total Revenue (GMV)',
      value: `₹${Number(overview.totalRevenue || 0).toLocaleString('en-IN')}`,
      subtext: `Today: ₹${Number(overview.todayRevenue || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-500',
      badge: 'All-Time',
    },
    {
      title: "Today's Revenue",
      value: `₹${Number(overview.todayRevenue || 0).toLocaleString('en-IN')}`,
      subtext: 'Calculated from 12:00 AM',
      icon: TrendingUp,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      badge: 'Live',
    },
    {
      title: 'Platform Commission',
      value: `₹${Number(overview.totalCommission || 0).toLocaleString('en-IN')}`,
      subtext: 'Marketplace Net Cut',
      icon: Coins,
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      badge: 'Net Profit',
    },
    {
      title: 'Pending Payouts',
      value: `₹${Number(overview.pendingPayouts || 0).toLocaleString('en-IN')}`,
      subtext: 'Vendors & Delivery Fleet',
      icon: Wallet,
      gradient: 'from-rose-500 via-pink-500 to-red-500',
      badge: 'Unsettled',
    },
  ];

  const orderLifecycleCards = [
    {
      title: 'Total Orders',
      value: overview.totalOrders || 0,
      subtext: 'Cumulative Checkouts',
      icon: ShoppingBag,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Pending Orders',
      value: overview.pendingOrders || 0,
      subtext: 'Awaiting Merchant Accept',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      badge: 'Action Needed',
    },
    {
      title: 'Active / In Transit',
      value: overview.activeOrders || 0,
      subtext: 'Preparing, Packed & Dispatched',
      icon: Truck,
      gradient: 'from-indigo-600 to-purple-600',
      badge: 'Live Flow',
    },
    {
      title: 'Completed Orders',
      value: overview.completedOrders || 0,
      subtext: 'Successfully Delivered',
      icon: CheckCircle,
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Cancelled Orders',
      value: overview.cancelledOrders || 0,
      subtext: 'Customer or Merchant void',
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
    },
    {
      title: 'Refund Requests',
      value: overview.refundRequests || overview.refundRequestsCount || 0,
      subtext: 'Disputes in Verification',
      icon: RotateCcw,
      gradient: 'from-pink-500 to-rose-500',
      badge: 'Grievance',
    },
  ];

  const networkPartnerCards = [
    {
      title: 'Total Customers',
      value: overview.totalCustomers || 0,
      subtext: `Active: ${overview.activeCustomers || overview.totalCustomers || 0}`,
      icon: Users,
      gradient: 'from-pink-600 to-rose-500',
    },
    {
      title: 'Active Customers',
      value: overview.activeCustomers || overview.totalCustomers || 0,
      subtext: 'Non-blocked accounts',
      icon: UserCheck,
      gradient: 'from-fuchsia-600 to-pink-500',
    },
    {
      title: 'Total Sellers / Stores',
      value: overview.totalSellers || 0,
      subtext: `Active: ${overview.activeSellers || 0}`,
      icon: Store,
      gradient: 'from-teal-600 to-emerald-600',
    },
    {
      title: 'Active Verified Sellers',
      value: overview.activeSellers || 0,
      subtext: 'KYC Approved & Live',
      icon: ShieldCheck,
      gradient: 'from-emerald-600 to-teal-500',
    },
    {
      title: 'Franchise Network',
      value: overview.totalFranchises || 0,
      subtext: 'City Service Area Hubs',
      icon: Building2,
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      title: 'Total Delivery Fleet',
      value: overview.totalDeliveryBoys || overview.totalDeliveryPartners || 0,
      subtext: `Online: ${overview.activeDeliveryBoys || overview.onlineDeliveryPartners || 0}`,
      icon: Bike,
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      title: 'Active Delivery Boys',
      value: overview.activeDeliveryBoys || overview.onlineDeliveryPartners || 0,
      subtext: 'Currently On-Duty GPS',
      icon: Activity,
      gradient: 'from-sky-500 to-cyan-500',
      badge: 'Online',
    },
    {
      title: 'Pending Delivery Requests',
      value: overview.pendingDeliveryRequests || 0,
      subtext: 'Unassigned Broadcasts',
      icon: Package,
      gradient: 'from-orange-500 to-red-500',
      badge: 'Dispatch',
    },
  ];

  // Status distribution for donut chart
  const orderStatusDistribution = analytics?.orderStatusDistribution || [
    { name: 'Completed', value: overview.completedOrders || 0, color: '#10B981' },
    { name: 'Active', value: overview.activeOrders || 0, color: '#6366F1' },
    { name: 'Pending', value: overview.pendingOrders || 0, color: '#F59E0B' },
    { name: 'Cancelled', value: overview.cancelledOrders || 0, color: '#EF4444' },
  ];

  const salesChartData = analytics?.salesChart || analytics?.revenueChart || [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* ========================================================
          1. SPECTACULAR HERO AURORA BANNER
      ======================================================== */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-700 via-indigo-700 via-purple-700 to-pink-600 text-white p-7 sm:p-9 shadow-glow-primary">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute left-1/3 -top-16 w-72 h-72 rounded-full bg-pink-400/25 blur-3xl pointer-events-none" />
        <div className="absolute left-10 -bottom-10 w-60 h-60 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white border border-white/25 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                Super Admin Master Command Center
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white border border-emerald-300/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {isConnected ? 'Socket.IO Real-Time Stream' : 'Standby Sync'}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/25 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-amber-200 border border-amber-300/30 flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Multi-Vendor & Franchise Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Namaste, {admin?.name || 'Super Admin'}</span>
              <span className="text-2xl sm:text-3xl">👑</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-medium leading-relaxed">
              Complete administrative authority over Customers, Vendors, Franchises, Delivery Fleet, Order Dispatch, Commissions, and Bank Payouts.
            </p>
          </div>

          {/* Quick Action Navigation Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/live-deliveries"
              className="px-4 py-2.5 rounded-2xl bg-cyan-400 text-slate-900 font-extrabold text-xs shadow-xl shadow-cyan-500/20 hover:bg-cyan-300 hover:scale-105 transition-all flex items-center gap-2">
              <Bike className="w-4 h-4 text-slate-900" />
              <span>Live Fleet Radar</span>
            </Link>

            <Link
              to="/franchises"
              className="px-4 py-2.5 rounded-2xl bg-white text-indigo-700 font-extrabold text-xs shadow-xl shadow-black/10 hover:bg-indigo-50 hover:scale-105 transition-all flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" />
              <span>Franchises</span>
            </Link>

            <Link
              to="/commissions"
              className="px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-900 font-extrabold text-xs shadow-xl shadow-amber-500/20 hover:bg-amber-300 hover:scale-105 transition-all flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-900" />
              <span>Commissions</span>
            </Link>

            <button
              onClick={fetchDashboardMetrics}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/30 border border-white/30 text-white transition-all shadow-sm"
              title="Refresh Dashboard">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Metrics Quick Strip on Hero */}
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
          <div>
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Today's Revenue</p>
            <p className="text-xl sm:text-2xl font-black mt-0.5">
              ₹{Number(overview.todayRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">Active Deliveries</p>
            <p className="text-xl sm:text-2xl font-black mt-0.5">{overview.activeOrders || 0}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Active Merchants</p>
            <p className="text-xl sm:text-2xl font-black mt-0.5">{overview.activeSellers || 0}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-pink-200 uppercase tracking-wider">Online Riders</p>
            <p className="text-xl sm:text-2xl font-black mt-0.5">{overview.activeDeliveryBoys || overview.onlineDeliveryPartners || 0}</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. TIMEFRAME SELECTOR BAR
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Marketplace 18-Pillar Command Overview</span>
            <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time aggregate data queried directly from database models
          </p>
        </div>

        {/* Daily, Weekly, Monthly, Yearly Timeframe Selector */}
        <div className="inline-flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-950/60 self-start sm:self-auto gap-1">
          {[
            { label: 'Today (Daily)', value: 'today' },
            { label: '7 Days (Weekly)', value: '7d' },
            { label: '30 Days (Monthly)', value: '30d' },
            { label: '1 Year (Yearly)', value: '1y' },
          ].map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                timeframe === tf.value
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. PILLAR A: FINANCIAL OVERVIEW (4 High-Priority Cards)
      ======================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Financial & Settlement Metrics
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-5 rounded-3xl border border-indigo-100/60 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {card.title}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shadow-md`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {card.value}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px] font-medium">{card.subtext}</span>
                  {card.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          4. PILLAR B: ORDER LIFECYCLE (6 Real-Time Cards)
      ======================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Order Lifecycle & Fulfillment Stages
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {orderLifecycleCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shadow-sm`}>
                    <Icon size={16} />
                  </div>
                  {card.badge && (
                    <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{card.title}</p>
                <p className="font-black text-xl text-gray-900 dark:text-white mt-0.5">{card.value}</p>
                <p className="text-[9px] text-gray-400 truncate mt-1">{card.subtext}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          5. PILLAR C: MULTI-VENDOR, FRANCHISE & FLEET NETWORK (8 Cards)
      ======================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Multi-Vendor, Franchise & Delivery Fleet Ecosystem
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {networkPartnerCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-indigo-200 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shadow-xs`}>
                    <Icon size={14} />
                  </div>
                  {card.badge && (
                    <span className="px-1 py-0.2 rounded text-[7px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate">
                  {card.title}
                </p>
                <p className="font-black text-lg text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-[8px] text-gray-500 truncate">{card.subtext}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          6. CHARTS SECTION (REVENUE AREA CHART + FULFILLMENT DONUT)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Order Trajectory Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Revenue & Order Volume Trajectory</span>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white shadow-xs">
                  {timeframe.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Dynamic time-series aggregation based on active database records
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
                <span>Gross GMV (₹)</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vibrantRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4)',
                  }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#vibrantRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Fulfillment Distribution Donut Chart */}
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-black text-base text-gray-900 dark:text-white flex items-center justify-between">
              <span>Orders Distribution</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                Breakdown
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Current fulfillment stage proportions</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value">
                  {orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {orderStatusDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-300 font-bold truncate">{item.name}</span>
                <span className="font-black text-gray-900 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          7. TOP SELLERS & BEST SELLING PRODUCTS
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Vendors */}
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Top Performing Stores / Vendors</span>
                <Award className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Highest order volume and sales volume</p>
            </div>
            <Link
              to="/sellers"
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {topSellers.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No vendor sales aggregated yet</p>
            ) : (
              topSellers.slice(0, 5).map((seller, idx) => (
                <div
                  key={seller._id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 dark:text-white">
                        {seller.storeName || 'Store'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">{seller.sellerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                      ₹{Number(seller.totalSales || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold">{seller.totalOrders || 0} Orders</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Top Selling Products</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Most demanded items across the marketplace</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
              <span>Catalog</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No completed product sales recorded</p>
            ) : (
              bestSellers.slice(0, 5).map((prod, idx) => (
                <div
                  key={prod._id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 hover:bg-rose-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 dark:text-white truncate max-w-[180px]">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">{prod.totalSold} Units Sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-gray-900 dark:text-white">
                      ₹{Number(prod.totalRevenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-bold">Gross Volume</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          8. LIVE ACTIVE DELIVERY TELEMETRY RADAR
      ======================================================== */}
      {liveActiveDeliveries.length > 0 && (
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-cyan-100 dark:border-cyan-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Live Active Delivery Telemetry</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time GPS coordinates of in-flight dispatches</p>
            </div>
            <Link
              to="/live-deliveries"
              className="text-xs font-black text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60">
              <span>Full Radar Screen</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cyan-50 dark:border-slate-800 text-gray-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="pb-3.5">Order</th>
                  <th className="pb-3.5">Delivery Rider</th>
                  <th className="pb-3.5">Vehicle</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5">Current GPS Coordinates</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-50/60 dark:divide-slate-800/60">
                {liveActiveDeliveries.slice(0, 5).map((delivery, idx) => (
                  <tr key={delivery._id || idx} className="hover:bg-cyan-50/20 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      #{delivery.orderNumber || delivery._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      {delivery.partnerName}
                      {delivery.partnerPhone && (
                        <span className="text-[10px] text-gray-400 block font-normal">{delivery.partnerPhone}</span>
                      )}
                    </td>
                    <td className="py-3.5 text-gray-600 dark:text-gray-300 font-medium">{delivery.vehicle}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
                        {delivery.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-500 font-mono text-[11px]">
                      {delivery.latitude && delivery.longitude
                        ? `${Number(delivery.latitude).toFixed(4)}, ${Number(delivery.longitude).toFixed(4)}`
                        : 'Stationary at Hub'}
                    </td>
                    <td className="py-3.5 text-right">
                      {delivery.partnerPhone && (
                        <a
                          href={`tel:${delivery.partnerPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[11px] font-bold inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          9. RECENT ORDERS & LOW STOCK WATCHLIST
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Recent Live Orders</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest multi-vendor customer checkouts</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-indigo-50 dark:border-slate-800 text-gray-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="pb-3.5">Order</th>
                  <th className="pb-3.5">Customer</th>
                  <th className="pb-3.5">Amount</th>
                  <th className="pb-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50/60 dark:divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 font-medium">
                      No recent orders recorded
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((o, idx) => (
                    <tr
                      key={o._id || idx}
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 font-black text-indigo-600 dark:text-indigo-400">
                        #{o.orderNumber || o.orderId || o._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                        {o.customerName || o.user?.name || 'Customer'}
                      </td>
                      <td className="py-3.5 font-black text-gray-900 dark:text-white">
                        ₹{Number(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200">
                          {o.orderStatus || o.status || 'Placed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel p-6 sm:p-7 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Low Stock Inventory Alerts</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Catalog products requiring immediate vendor restock</p>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60">
              <span>Manage Stock</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-indigo-50 dark:border-slate-800 text-gray-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="pb-3.5">Product</th>
                  <th className="pb-3.5">SKU</th>
                  <th className="pb-3.5">Units Left</th>
                  <th className="pb-3.5">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50/60 dark:divide-slate-800/60">
                {lowStockList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 font-medium">
                      All catalog items have healthy stock levels
                    </td>
                  </tr>
                ) : (
                  lowStockList.slice(0, 5).map((p, idx) => (
                    <tr
                      key={p._id || idx}
                      className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                        {p.name}
                      </td>
                      <td className="py-3.5 text-gray-400 font-mono text-[11px] font-bold">{p.sku || 'N/A'}</td>
                      <td className="py-3.5 font-black text-amber-600 dark:text-amber-400">
                        {p.stock ?? p.quantity ?? 0} left
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                          Restock
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
