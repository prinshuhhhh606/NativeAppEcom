import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [reportType, setReportType] = useState('sales'); // 'sales' | 'products' | 'inventory'
  const [dateRange, setDateRange] = useState('30days'); // '7days' | '30days' | 'month' | 'all'
  const [chartView, setChartView] = useState('weekly'); // 'weekly' | 'monthly'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (reportType === 'sales') {
        res = await sellerService.getSalesReport({ range: dateRange });
      } else if (reportType === 'products') {
        res = await sellerService.getProductsReport({ range: dateRange });
      } else {
        res = await sellerService.getInventoryReport();
      }
      setData(res.data?.records || res.data || []);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    // Convert object array to CSV string
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AppEcom_${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${reportType.toUpperCase()} report as CSV!`);
  };

  // Sample analytics chart data for weekly & monthly views
  const weeklySalesData = [
    { period: 'Mon', revenue: 14500, orders: 12 },
    { period: 'Tue', revenue: 22800, orders: 18 },
    { period: 'Wed', revenue: 18900, orders: 15 },
    { period: 'Thu', revenue: 31200, orders: 25 },
    { period: 'Fri', revenue: 27400, orders: 21 },
    { period: 'Sat', revenue: 42600, orders: 34 },
    { period: 'Sun', revenue: 38900, orders: 29 },
  ];

  const monthlySalesData = [
    { period: 'Week 1', revenue: 124500, orders: 98 },
    { period: 'Week 2', revenue: 158200, orders: 124 },
    { period: 'Week 3', revenue: 182600, orders: 142 },
    { period: 'Week 4', revenue: 214800, orders: 171 },
  ];

  const activeChartData = chartView === 'weekly' ? weeklySalesData : monthlySalesData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Sales & Business Analytics
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time sales velocity, revenue performance, GST summaries, and inventory valuation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchReport}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Colorful Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 block">
                ₹3,48,200
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>+18.4% from previous period</span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Delivered Orders
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                438
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>98.2% fulfillment rate</span>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Avg. Order Value
              </span>
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                ₹795
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Optimal basket size</span>
          </div>
        </div>

        {/* Return Rate Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Return Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                1.4%
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Percent className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowDownRight className="w-4 h-4" />
            <span>-0.6% below category benchmark</span>
          </div>
        </div>
      </div>

      {/* Sales Charts (Weekly and Monthly) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              Revenue Growth & Sales Trends
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Interactive timeline of order values and unit volumes.
            </p>
          </div>

          {/* Weekly vs Monthly Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setChartView('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                chartView === 'weekly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setChartView('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                chartView === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly View
            </button>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsColorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} vertical={false} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '16px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#reportsColorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Bar: Report Type & Range */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setReportType('sales')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              reportType === 'sales'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Sales & Revenue Ledger
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              reportType === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Product Velocity
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              reportType === 'inventory'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Inventory Valuation
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">Current Month</option>
            <option value="all">Lifetime History</option>
          </select>
        </div>
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 dark:text-white capitalize">
            {reportType} Records Preview
          </h3>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            {data.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          {data.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/60 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700 text-gray-500 uppercase font-extrabold">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="py-3.5 px-4 font-mono">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 font-medium">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-40 text-blue-500" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                No records match the selected date range
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Change the date range filter or execute new transactions to view ledger records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;