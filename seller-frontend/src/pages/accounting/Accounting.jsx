import React, { useState, useEffect } from 'react';
import {
  FileText,
  IndianRupee,
  Download,
  Printer,
  Calendar,
  Building,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Calculator,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const Accounting = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchGstData = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getGstTaxReport({ month, year });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load GST tax records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGstData();
  }, [month, year]);

  const handleExportCsv = () => {
    if (!data?.transactions || data.transactions.length === 0) {
      toast.error('No tax records to export');
      return;
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Order Ref',
      'Customer State',
      'Supply Type',
      'Gross Amount (INR)',
      'Taxable Value (INR)',
      'GST Rate',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Total Tax (INR)',
    ];

    const rows = data.transactions.map((t) => [
      t.invoiceNumber,
      new Date(t.date).toLocaleDateString('en-IN'),
      t.orderNumber,
      `"${t.customerState}"`,
      `"${t.supplyType}"`,
      t.grossAmount,
      t.taxableValue,
      t.gstRate,
      t.cgst,
      t.sgst,
      t.igst,
      t.totalTax,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bharat_Bazaar_GST_Report_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('GST CSV report downloaded successfully');
  };

  const summary = data?.summary || {};
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>GST & Accounting Compliance Center</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Indian tax invoicing statements, CGST / SGST / IGST breakdown, and auditable financial records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Year Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-emerald-600 ml-1.5" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={fetchGstData}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Tax Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export GST CSV</span>
          </button>
        </div>
      </div>

      {/* GST Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Gross B2C Sales
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            ₹{(summary.totalGrossSales || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            Total marketplace invoice value
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Base Taxable Value
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            ₹{(summary.totalTaxableValue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            Net taxable revenue base
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total GST Collected
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            ₹{(summary.totalTaxCollected || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-semibold">
            CGST + SGST + IGST
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Merchant GSTIN
          </span>
          <span className="text-base font-mono font-black text-gray-900 dark:text-white mt-1 block truncate">
            {summary.gstin || '08AABCU9603R1ZM'}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            Verified Indian Tax Entity
          </span>
        </div>
      </div>

      {/* Tax Breakdown Sub-Card */}
      <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="font-bold text-gray-500 dark:text-gray-400 block">Intra-State CGST (9%)</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">
            ₹{(summary.totalCgst || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="font-bold text-gray-500 dark:text-gray-400 block">Intra-State SGST (9%)</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">
            ₹{(summary.totalSgst || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="font-bold text-gray-500 dark:text-gray-400 block">Inter-State IGST (18%)</span>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
            ₹{(summary.totalIgst || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Auditable Sales & Tax Invoices Ledger
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Full record of issued tax invoices compliant with GSTR-1 & GSTR-3B filings
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Supply Type</th>
                <th className="py-3.5 px-4 text-right">Gross (INR)</th>
                <th className="py-3.5 px-4 text-right">Taxable</th>
                <th className="py-3.5 px-4 text-right">Total GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Compiling GST records...</span>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {tx.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-[10px]">
                        {tx.supplyType} ({tx.customerState})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-gray-900 dark:text-white">
                      ₹{tx.grossAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600 dark:text-gray-300">
                      ₹{tx.taxableValue?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{tx.totalTax?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No tax invoices recorded for this period</p>
                    <p className="text-xs text-gray-400 mt-1">
                      As customer orders are fulfilled, their automated GST invoices will appear here.
                    </p>
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

export default Accounting;

