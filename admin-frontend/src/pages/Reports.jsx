import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, IndianRupee, ShoppingBag, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let query = '/reports/sales';
      if (startDate) query += `?startDate=${startDate}`;
      if (endDate) query += `${startDate ? '&' : '?'}endDate=${endDate}`;
      const res = await api.get(query);
      setSalesData(res.data);
    } catch (err) {
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    let url = `http://localhost:5000/api/v1/admin/reports/export-csv?type=${type}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  const summary = salesData?.summary || {};
  const dailyReport = salesData?.dailyReport || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Financial & Sales Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit-ready revenue breakdown, tax collection, discounts given, and CSV exports.
          </p>
        </div>

        {/* Quick CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('orders')}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm">
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Orders CSV</span>
          </button>
          <button
            onClick={() => handleExport('customers')}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm">
            <FileSpreadsheet size={15} className="text-blue-600" />
            <span>Customers CSV</span>
          </button>
          <button
            onClick={() => handleExport('inventory')}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center space-x-1.5 shadow-sm">
            <FileSpreadsheet size={15} className="text-purple-600" />
            <span>Inventory CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-gray-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-gray-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs outline-none"
          />
        </div>

        <button
          onClick={fetchReport}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
          Apply Filter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Net Revenue
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ₹{Number(summary.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Orders
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {summary.totalOrders || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Discounts Granted
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{Number(summary.totalDiscountGiven || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            GST Collected (18%)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{Number(summary.totalTaxCollected || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 font-bold text-sm text-gray-900 dark:text-white">
          Daily Sales Breakdown
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Discounts</th>
                <th className="py-3 px-4">Shipping</th>
                <th className="py-3 px-4">GST Tax</th>
                <th className="py-3 px-4 font-bold text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    Loading report data...
                  </td>
                </tr>
              ) : dailyReport.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No sales recorded for this date range
                  </td>
                </tr>
              ) : (
                dailyReport.map((day) => (
                  <tr key={day._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {day._id}
                    </td>
                    <td className="py-3 px-4 font-bold">{day.totalOrders}</td>
                    <td className="py-3 px-4 font-mono">₹{day.grossSales}</td>
                    <td className="py-3 px-4 text-amber-600 font-mono">-₹{day.discounts}</td>
                    <td className="py-3 px-4 font-mono">₹{day.shippingCharges}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600">₹{day.taxes}</td>
                    <td className="py-3 px-4 font-black text-sm text-gray-900 dark:text-white text-right">
                      ₹{day.netRevenue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

