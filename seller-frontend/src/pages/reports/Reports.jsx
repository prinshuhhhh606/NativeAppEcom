import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, RefreshCw, FileSpreadsheet } from 'lucide-react';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [reportType, setReportType] = useState('sales'); // 'sales' | 'products' | 'inventory'
  const [dateRange, setDateRange] = useState('30days'); // '7days' | '30days' | 'month' | 'all'
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
      setData(res.data.records || res.data || []);
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
    link.setAttribute('download', `BharatBazaar_${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${reportType.toUpperCase()} report as CSV!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Analytics & Business Reporting
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Generate and export compliance-ready GST sales registers, product velocity, and stock valuation CSVs.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={data.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Control Bar: Report Type & Range */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              reportType === 'sales'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Sales & Revenue Ledger
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              reportType === 'products'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Product Catalog Performance
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              reportType === 'inventory'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Inventory Stock Valuation
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200"
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
          <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
            {reportType} Report Records Preview
          </h3>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {data.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          {data.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/60 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700 text-gray-400 uppercase font-semibold">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="py-3 px-4 font-mono">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 font-medium">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="text-sm font-semibold">No records match the selected date range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

