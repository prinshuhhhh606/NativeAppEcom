import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle, ArrowUpDown, Plus, Minus, RefreshCw, CheckCircle2 } from 'lucide-react';
import sellerService from '../../services/sellerService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'reduce'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('New procurement batch arrived');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getInventory();
      setItems(res.data.products || res.data || []);
    } catch (err) {
      toast.error('Failed to load inventory stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'low') return item.stock > 0 && item.stock <= 5;
    if (filter === 'out') return item.stock === 0;
    return true;
  });

  const handleOpenAdjust = (product, type = 'add') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setQuantity('');
    setReason(type === 'add' ? 'New procurement batch arrived' : 'Inventory audit write-off');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    const adjustment = adjustType === 'add' ? qtyNum : -qtyNum;
    if (adjustType === 'reduce' && selectedProduct.stock + adjustment < 0) {
      toast.error('Stock cannot be reduced below 0');
      return;
    }

    setSubmitting(true);
    try {
      await sellerService.adjustStock({
        productId: selectedProduct._id,
        adjustment,
        reason,
      });

      toast.success(
        `Stock successfully ${adjustType === 'add' ? 'increased' : 'reduced'} by ${qtyNum} units`
      );
      setSelectedProduct(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Warehouse Inventory & Stock
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time SKU stock levels, buffer alerts, and stock ledger adjustments.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            All Inventory ({items.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Low Stock Alert ({items.filter((i) => i.stock > 0 && i.stock <= 5).length})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Out of Stock ({items.filter((i) => i.stock === 0).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute inset-y-0 left-0 pl-3 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or name..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">Product & SKU</th>
                <th className="py-3.5 px-4">Available Units</th>
                <th className="py-3.5 px-4">Buffer Status</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-5 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1 max-w-[240px]">
                            {item.productName}
                          </p>
                          <p className="text-[11px] font-mono text-gray-400">SKU: {item.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                      {item.stock}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.stock === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Out of Stock
                        </span>
                      ) : item.stock <= 5 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Stock Healthy
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      ₹{item.price?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAdjust(item, 'add')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>

                        <button
                          onClick={() => handleOpenAdjust(item, 'reduce')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Reduce</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400">
                    No inventory records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Adjust Inventory — ${selectedProduct.productName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl text-xs flex justify-between items-center">
              <span className="text-gray-500">Current Available Units:</span>
              <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                {selectedProduct.stock}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  adjustType === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                + Restock Add
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('reduce')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  adjustType === 'reduce'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                - Reduce / Write-off
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Number of Units to {adjustType === 'add' ? 'Add' : 'Deduct'} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 25"
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Reason / Note for Stock Audit
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Received new shipment from workshop"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {submitting ? 'Applying...' : 'Confirm Stock Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;

