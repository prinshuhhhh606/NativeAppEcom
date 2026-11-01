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
  Legend,
} from 'recharts';
import api from '../services/api';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchDashboardMetrics();
  }, [timeframe]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?timeframe=${timeframe}`);
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

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time Pan-India sales, inventory status, and delivery metrics.
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 self-start sm:self-auto">
          {[
            { label: 'Today', value: 'today' },
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: 'This Month', value: 'this_month' },
          ].map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === tf.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{Number(overview.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp size={14} className="mr-1" />
            <span>Today: ₹{Number(overview.todayRevenue || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {overview.totalOrders || 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 font-semibold">
            <Clock size={14} className="mr-1" />
            <span>{overview.todayOrders || 0} placed today</span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {overview.totalCustomers || 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            <ArrowUpRight size={14} className="mr-1" />
            <span>+{overview.todayCustomers || 0} new today</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Inventory Alert
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {overview.lowStockProducts || 0} Low / {overview.outOfStockProducts || 0} Out
          </div>
          <div className="mt-2 text-xs text-gray-500 font-semibold">
            {overview.totalProducts || 0} Active Products
          </div>
        </div>
      </div>

      {/* Secondary Status Pipeline Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <Clock className="text-amber-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Pending</p>
            <p className="font-extrabold text-sm">{overview.pendingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <Package className="text-blue-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Processing</p>
            <p className="font-extrabold text-sm">{overview.processingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <Truck className="text-purple-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Shipped</p>
            <p className="font-extrabold text-sm">{overview.shippedOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <CheckCircle className="text-emerald-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Delivered</p>
            <p className="font-extrabold text-sm">{overview.deliveredOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <RotateCcw className="text-rose-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Returns</p>
            <p className="font-extrabold text-sm">{overview.refundRequestsCount || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
          <Layers className="text-indigo-500" size={18} />
          <div>
            <p className="text-xs text-gray-400">Categories</p>
            <p className="font-extrabold text-sm">{overview.totalCategories || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Section: Revenue Area Chart + Order Status Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                Sales & Revenue Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Daily dynamic revenue trajectory
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {analytics.salesChart && analytics.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.salesChart}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2874F0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2874F0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2874F0"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No revenue recorded in this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Order Status Breakdown
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Current fulfillment distribution
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {analytics.orderStatusDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.orderStatusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value">
                    {analytics.orderStatusDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Recent Orders
            </h2>
            <Link
              to="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400">
                  <th className="py-2.5 font-bold">Order ID</th>
                  <th className="py-2.5 font-bold">Customer</th>
                  <th className="py-2.5 font-bold">Total</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-blue-600">{order.orderId}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">
                        {order.shippingAddress?.fullName}
                      </td>
                      <td className="py-3 font-bold">₹{order.pricing?.grandTotal}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                          {order.orderStatus}
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <span>Low Stock Alerts</span>
            </h2>
            <Link
              to="/inventory"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
              Manage Inventory <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400">
                  <th className="py-2.5 font-bold">Product</th>
                  <th className="py-2.5 font-bold">SKU</th>
                  <th className="py-2.5 font-bold">Price</th>
                  <th className="py-2.5 font-bold">Stock Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {lowStockList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">
                      All products well stocked
                    </td>
                  </tr>
                ) : (
                  lowStockList.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                        {item.name}
                      </td>
                      <td className="py-3 text-gray-500 font-mono text-[11px]">{item.sku}</td>
                      <td className="py-3 font-bold">₹{item.price}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.stock === 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                          {item.stock} left
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

