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
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import sellerService from '../../services/sellerService';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { seller, isApproved } = useAuth();
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
    availableBalance: data?.overview?.availableBalance ?? data?.kpis?.availableBalance ?? seller?.balance?.available ?? 0,
    pendingBalance: data?.overview?.pendingBalance ?? data?.kpis?.pendingBalance ?? seller?.balance?.pending ?? 0,
    lowStockCount: data?.overview?.lowStockProducts ?? data?.kpis?.lowStockCount ?? 0,
    totalProducts: data?.overview?.totalProducts ?? data?.kpis?.totalProducts ?? 0,
  };

  const salesTrend = data?.salesChart || data?.salesTrend || [];
  const recentOrders = data?.recentOrders || [];
  const lowStockProducts = data?.lowStockList || data?.lowStockProducts || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Namaste, {seller?.name?.split(' ')[0] || 'Partner'}! 👋
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time performance summary for <span className="font-semibold text-gray-800 dark:text-gray-200">{seller?.storeName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isApproved ? (
            <Link
              to="/products"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
          ) : (
            <Link
              to="/kyc-verification"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>KYC Verification In-Progress</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales"
          value={`₹${(kpis.grossSales || 0).toLocaleString('en-IN')}`}
          subtitle="Total marketplace buyer revenue"
          icon={IndianRupee}
          color="emerald"
          trend={12.5}
        />
        <StatCard
          title="Net Earnings"
          value={`₹${(kpis.netEarnings || 0).toLocaleString('en-IN')}`}
          subtitle={`After ${seller?.commissionRate || 10}% platform fee`}
          icon={TrendingUp}
          color="blue"
          trend={14.2}
        />
        <StatCard
          title="Total Sub-Orders"
          value={kpis.totalOrders || 0}
          subtitle="Orders assigned to your store"
          icon={ShoppingBag}
          color="purple"
        />
        <StatCard
          title="Available Balance"
          value={`₹${(kpis.availableBalance || 0).toLocaleString('en-IN')}`}
          subtitle={`₹${(kpis.pendingBalance || 0).toLocaleString('en-IN')} pending delivery`}
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* Sales Trend Chart & Order Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Revenue & Sales Performance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily earnings trajectory (INR)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              Last 30 Days
            </span>
          </div>

          <div className="h-72 w-full">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Gross Sales']}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                <p>No sales history recorded yet for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Inventory Alert Box (1 col) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Low Stock Watchlist</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                {lowStockProducts.length} Alert{lowStockProducts.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                          📦
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 max-w-[140px]">
                          {p.productName}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">SKU: {p.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2 py-1 rounded-lg ${
                        p.stock === 0
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  All inventory stocks are healthy!
                </div>
              )}
            </div>
          </div>

          <Link
            to="/inventory"
            className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
          >
            <span>Manage All Inventory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Customer Sub-Orders</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fulfillment orders requiring warehouse dispatch</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Sub-Order #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Net Earnings</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      {order.subOrderNumber || order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 text-gray-600 dark:text-gray-300">
                      {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                    </td>
                    <td className="py-3.5 text-gray-500 dark:text-gray-400">
                      {order.items?.length || 1} item(s)
                    </td>
                    <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(order.netEarnings || order.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={order.fulfillmentStatus || order.status || 'new'} size="sm" />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to="/orders"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    No orders received yet. Once approved, customer orders will show here in real-time.
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
