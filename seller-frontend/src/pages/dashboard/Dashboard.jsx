import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Package,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Eye,
  AlertCircle,
  ExternalLink,
  Truck,
  RotateCcw,
  PackageCheck,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
  ShoppingBasket,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import sellerService from '../../services/sellerService';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { seller, isApproved, isPending, isRejected, isSuspended } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getDashboardOverview();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = {
    grossSales: data?.overview?.grossSales ?? data?.kpis?.grossSales ?? 0,
    netEarnings: data?.overview?.netEarnings ?? data?.kpis?.netEarnings ?? 0,
    totalOrders: data?.overview?.totalOrders ?? data?.kpis?.totalOrders ?? 0,
    availableBalance:
      data?.overview?.availableBalance ??
      data?.kpis?.availableBalance ??
      seller?.balance?.available ??
      0,
    pendingBalance:
      data?.overview?.pendingBalance ??
      data?.kpis?.pendingBalance ??
      seller?.balance?.pending ??
      0,
    lowStockCount: data?.overview?.lowStockProducts ?? data?.kpis?.lowStockCount ?? 0,
    totalProducts: data?.overview?.totalProducts ?? data?.kpis?.totalProducts ?? 0,
    publishedProducts:
      data?.overview?.publishedProducts ??
      data?.overview?.activeProducts ??
      data?.kpis?.publishedProducts ??
      0,
    outOfStockCount: data?.overview?.outOfStockProducts ?? 0,
    newOrders: data?.overview?.newOrders ?? 0,
    pendingOrders: data?.overview?.pendingOrders ?? 0,
    confirmedOrders: data?.overview?.confirmedOrders ?? 0,
    processingOrders: data?.overview?.processingOrders ?? 0,
    readyToShipOrders: data?.overview?.readyToShipOrders ?? 0,
    shippedOrders: data?.overview?.shippedOrders ?? 0,
    deliveredOrders: data?.overview?.deliveredOrders ?? 0,
    cancelledOrders: data?.overview?.cancelledOrders ?? 0,
    returnedOrders: data?.overview?.returnedOrders ?? 0,
  };

  const salesTrend = data?.salesChart || data?.salesTrend || [];
  const recentOrders = data?.recentOrders || [];
  const recentProducts = data?.recentProducts || [];
  const lowStockProducts = data?.lowStockList || data?.lowStockProducts || [];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Attractive Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 shadow-glow-primary">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Store Performance Hub
              </span>
              {isApproved && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-white border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Merchant
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome back, {seller?.name?.split(' ')[0] || 'Partner'}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-xl">
              Overview for <span className="font-bold text-white underline decoration-amber-400 decoration-2">{seller?.storeName || 'Jaipur Handlooms'}</span>.
              Manage Pan-India dispatches, live catalog inventory, and settlements.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-stretch md:self-auto">
            <button
              onClick={fetchDashboardData}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-sm"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/products?action=add"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>+ Add Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards: Vibrant Colorful Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales (Royal Blue) */}
        <StatCard
          title="Total Sales"
          value={`₹${(kpis.grossSales || 0).toLocaleString('en-IN')}`}
          subtitle="Buyer gross transactions"
          icon={IndianRupee}
          gradient
          color="blue"
          trend={12.5}
        />

        {/* Net Revenue (Purple) */}
        <StatCard
          title="Revenue"
          value={`₹${(kpis.netEarnings || 0).toLocaleString('en-IN')}`}
          subtitle={`Net after ${seller?.commissionRate || 10}% fee`}
          icon={TrendingUp}
          gradient
          color="purple"
          trend={8.2}
        />

        {/* Total Orders (Indigo/Royal Blue) */}
        <StatCard
          title="Total Orders"
          value={kpis.totalOrders}
          subtitle="Processed sub-orders"
          icon={ShoppingBag}
          gradient
          color="indigo"
          trend={15.0}
        />

        {/* Pending Orders (Orange / Amber) */}
        <StatCard
          title="Pending Orders"
          value={kpis.pendingOrders + kpis.newOrders}
          subtitle="Awaiting packing / accept"
          icon={AlertCircle}
          gradient
          color="orange"
          badge="Action Req."
        />

        {/* Active Products (Green / Emerald) */}
        <StatCard
          title="Products"
          value={kpis.publishedProducts || kpis.totalProducts}
          subtitle={`${kpis.lowStockCount} low on stock`}
          icon={Package}
          gradient
          color="green"
          badge="Active"
        />
      </div>

      {/* 3. Secondary Metrics: Balance & Available Payout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Available Settlement Balance"
          value={`₹${(kpis.availableBalance || 0).toLocaleString('en-IN')}`}
          subtitle="Eligible for instant bank transfer"
          icon={Wallet}
          color="green"
          badge="Ready"
        />
        <StatCard
          title="Escrow / Pending Balance"
          value={`₹${(kpis.pendingBalance || 0).toLocaleString('en-IN')}`}
          subtitle="Releases upon customer delivery"
          icon={Clock}
          color="orange"
          badge="T+2 Pipeline"
        />
        <StatCard
          title="Low & Out-of-Stock Items"
          value={`${kpis.lowStockCount + kpis.outOfStockCount} items`}
          subtitle="Restock to prevent delivery drops"
          icon={Boxes}
          color="rose"
          badge="Alerts"
        />
      </div>

      {/* 4. Sales Analytics & Low Stock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Sales & Revenue Trajectory
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visual analysis of daily gross revenue in Indian Rupees (₹)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/60">
                Weekly & Monthly Trends
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorSalesModern" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '1rem',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSalesModern)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-2">
                <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <p>No sales history recorded yet for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Watchlist (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Low Stock Watchlist
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300">
                {lowStockProducts.length} Items
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                          📦
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[130px]">
                          {p.productName}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          SKU: {p.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-1 rounded-lg ${
                        p.stock === 0
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400'
                      }`}
                    >
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  All inventory stocks are healthy!
                </div>
              )}
            </div>
          </div>

          <Link
            to="/inventory"
            className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
          >
            <span>Manage All Inventory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 5. Complete Order Lifecycle Status Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-blue-600" />
              <span>Order Fulfillment Lifecycle Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live stages of incoming customer purchases and pan-India courier shipments
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Open Orders Module</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/orders?status=all"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">All Orders</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{kpis.totalOrders}</p>
            <span className="text-[10px] text-slate-400 font-semibold">Total Lifetime</span>
          </Link>

          <Link
            to="/orders?status=new"
            className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">New Orders</span>
            <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{kpis.newOrders}</p>
            <span className="text-[10px] text-purple-500 font-semibold">Requires Accept</span>
          </Link>

          <Link
            to="/orders?status=pending"
            className="p-3.5 rounded-2xl bg-orange-50/60 hover:bg-orange-100/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Pending Orders</span>
            <p className="text-xl font-black text-orange-700 dark:text-orange-400 mt-0.5">{kpis.pendingOrders}</p>
            <span className="text-[10px] text-orange-500 font-semibold">Awaiting Action</span>
          </Link>

          <Link
            to="/orders?status=confirmed"
            className="p-3.5 rounded-2xl bg-blue-50/60 hover:bg-blue-100/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Confirmed</span>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{kpis.confirmedOrders}</p>
            <span className="text-[10px] text-blue-500 font-semibold">Accepted by Store</span>
          </Link>

          <Link
            to="/orders?status=processing"
            className="p-3.5 rounded-2xl bg-indigo-50/60 hover:bg-indigo-100/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Processing</span>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5">{kpis.processingOrders}</p>
            <span className="text-[10px] text-indigo-500 font-semibold">Packaging Phase</span>
          </Link>

          <Link
            to="/shipping?status=ready_to_ship"
            className="p-3.5 rounded-2xl bg-cyan-50/60 hover:bg-cyan-100/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block">Ready to Ship</span>
            <p className="text-xl font-black text-cyan-700 dark:text-cyan-400 mt-0.5">{kpis.readyToShipOrders}</p>
            <span className="text-[10px] text-cyan-500 font-semibold">AWB Generated</span>
          </Link>

          <Link
            to="/shipping?status=shipped"
            className="p-3.5 rounded-2xl bg-blue-100/60 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Shipped / Transit</span>
            <p className="text-xl font-black text-blue-800 dark:text-blue-300 mt-0.5">{kpis.shippedOrders}</p>
            <span className="text-[10px] text-blue-600 font-semibold">With Courier</span>
          </Link>

          <Link
            to="/shipping?status=delivered"
            className="p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{kpis.deliveredOrders}</p>
            <span className="text-[10px] text-emerald-500 font-semibold">Fulfilled</span>
          </Link>

          <Link
            to="/orders?status=cancelled"
            className="p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Cancelled</span>
            <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{kpis.cancelledOrders}</p>
            <span className="text-[10px] text-rose-500 font-semibold">Rejected / Cancelled</span>
          </Link>

          <Link
            to="/returns"
            className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 transition-all text-left"
          >
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Returns & NDR</span>
            <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{kpis.returnedOrders}</p>
            <span className="text-[10px] text-purple-500 font-semibold">Reverse Logistics</span>
          </Link>
        </div>
      </div>

      {/* 6. Recent Customer Orders Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recent Customer Sub-Orders
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Orders placed by customers for your store products
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="pb-3.5">Sub-Order #</th>
                <th className="pb-3.5">Customer Name</th>
                <th className="pb-3.5">Items</th>
                <th className="pb-3.5">Net Earnings</th>
                <th className="pb-3.5">Status</th>
                <th className="pb-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {order.subOrderNumber || order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">
                      {order.items?.length || 1} item(s)
                    </td>
                    <td className="py-4 font-black text-emerald-600 dark:text-emerald-400">
                      ₹{(order.netEarnings || order.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={order.fulfillmentStatus || order.status || 'new'} size="sm" />
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to="/orders"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-100 dark:border-blue-900/40"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No customer orders received yet. Active listings will receive orders in real-time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
