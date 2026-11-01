import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  History,
  AlertTriangle,
  Search,
  X,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'STOCK_IN',
    quantity: '',
    reason: '',
  });

  // History Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [page, statusFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let query = `/inventory?page=${page}&limit=15`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(query);
      setItems(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setAdjustForm({
      type: 'STOCK_IN',
      quantity: '10',
      reason: 'Warehouse replenishment batch',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        productId: selectedItem.product?._id || selectedItem.product,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason,
      });

      toast.success('Stock adjusted and audit transaction recorded');
      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Stock adjustment failed');
    }
  };

  const handleOpenHistory = async (item = null) => {
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      let url = '/inventory/history?limit=30';
      if (item) url += `&productId=${item.product?._id || item.product}`;
      const res = await api.get(url);
      setHistoryLogs(res.data || []);
    } catch (err) {
      toast.error('Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Atomic SKU tracking, multi-variant allocation, warehouse stock-in and audit trails.
          </p>
        </div>

        <button
          onClick={() => handleOpenHistory()}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-2 shadow-sm">
          <History size={15} />
          <span>View All Stock Logs</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search by SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All Stock', value: 'all' },
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock (<10)', value: 'low_stock' },
            { label: 'Out of Stock (0)', value: 'out_of_stock' },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => {
                setStatusFilter(st.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No inventory records found
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={it.product?.images?.[0] || 'https://via.placeholder.com/50'}
                          alt={it.product?.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-slate-700 shrink-0"
                        />
                        <div className="max-w-xs">
                          <p className="font-bold text-gray-900 dark:text-white truncate">
                            {it.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">SKU: {it.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {it.location || 'Central Warehouse - Mumbai'}
                    </td>
                    <td className="py-3 px-4 font-black text-sm text-gray-900 dark:text-white">
                      {it.currentStock}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {it.availableStock !== undefined ? it.availableStock : it.currentStock}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          it.status === 'out_of_stock' || it.currentStock === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : it.status === 'low_stock' || it.currentStock <= 10
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}>
                        {it.currentStock === 0 ? 'Out of Stock' : it.currentStock <= 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenAdjust(it)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition-colors">
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => handleOpenHistory(it)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg">
                          <History size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Stock Adjustment
                </h3>
                <p className="text-xs text-gray-500">{selectedItem.product?.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-500">Current In-Stock Quantity:</span>
                <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {selectedItem.currentStock} units
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 dark:text-white">
                  <option value="STOCK_IN">Stock In (Receive shipment / New Inventory)</option>
                  <option value="STOCK_OUT">Stock Out (Damaged / Missing / Return to vendor)</option>
                  <option value="ADJUSTMENT">Reset Stock (Exact count after physical audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {adjustForm.type === 'ADJUSTMENT' ? 'New Total Stock *' : 'Quantity Units *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Batch intake PO-9812, Damaged in transit, etc."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm shadow-blue-500/30">
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto border-l border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <History className="text-blue-600" size={18} />
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Stock Audit Log
                  </h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800 mt-4">
                {historyLoading ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    Loading audit trail...
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No transactions recorded
                  </div>
                ) : (
                  historyLogs.map((log) => (
                    <div key={log._id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {log.sku}
                        </span>
                        <span
                          className={`font-black ${
                            log.changeQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                          {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity} units
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{log.reason}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>By: {log.admin?.name || 'System / Order'}</span>
                        <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200">
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

