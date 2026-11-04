import React, { useState, useEffect } from 'react';
import {
  Percent,
  DollarSign,
  TrendingUp,
  Settings2,
  CheckCircle,
  Layers,
  Save,
  FileText,
  Store,
  Building2,
  Bike,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Commissions = () => {
  const [data, setData] = useState({
    commissions: {},
    categories: [],
    stats: {},
  });
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    defaultSellerCommission: 10,
    defaultFranchiseCommission: 3.5,
    defaultDeliveryPartnerFee: 65,
    minimumDeliveryCharge: 40,
    platformCommission: 5,
  });

  useEffect(() => {
    fetchCommissions();
    fetchLedger();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/commissions');
      setData(res.data || {});
      if (res.data?.commissions) {
        setForm(res.data.commissions);
      }
    } catch (err) {
      toast.error('Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await api.get('/commissions/ledger');
      setLedger(res.data || []);
    } catch (err) {}
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/commissions', form);
      toast.success('Global commission parameters updated successfully!');
      fetchCommissions();
    } catch (err) {
      toast.error('Failed to update commission settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategoryCommission = async (categoryId, rate) => {
    try {
      await api.patch(`/commissions/category/${categoryId}`, { commissionPercentage: Number(rate) });
      toast.success('Category commission updated');
      fetchCommissions();
    } catch (err) {
      toast.error('Failed to update category commission');
    }
  };

  const stats = data.stats || {};
  const categories = data.categories || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="text-indigo-600" />
            Commission Architecture & Revenue Rules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure multi-vendor commission rates, regional franchise splits, delivery fees & transparent ledger
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Platform Commission Earned</span>
            <DollarSign className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{(stats.totalCommissionEarned || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Merchant Gross Sales</span>
            <Store className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            ₹{(stats.totalSales || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Net Payable to Merchants</span>
            <TrendingUp className="text-purple-500" size={18} />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            ₹{(stats.totalSellerPayouts || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Global Configuration Form */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm p-6">
        <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Settings2 size={18} className="text-indigo-600" />
          Global Commission & Fulfillment Fee Rates
        </h2>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Default Seller Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.defaultSellerCommission}
              onChange={(e) => setForm({ ...form, defaultSellerCommission: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Platform fee deducted from seller sales</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Default Franchise Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.defaultFranchiseCommission}
              onChange={(e) => setForm({ ...form, defaultFranchiseCommission: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Regional territorial partner cut</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Delivery Partner Fee per Order (₹)
            </label>
            <input
              type="number"
              value={form.defaultDeliveryPartnerFee}
              onChange={(e) => setForm({ ...form, defaultDeliveryPartnerFee: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Credited to rider wallet upon OTP delivery</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Minimum Delivery Charge (₹)
            </label>
            <input
              type="number"
              value={form.minimumDeliveryCharge}
              onChange={(e) => setForm({ ...form, minimumDeliveryCharge: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Platform Fixed Margin (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.platformCommission}
              onChange={(e) => setForm({ ...form, platformCommission: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition">
              <Save size={16} />
              {saving ? 'Saving Changes...' : 'Save Commission Rules'}
            </button>
          </div>
        </form>
      </div>

      {/* Category Specific Commission Table */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            Category-Specific Commission Overrides
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{c.name}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    {c.commissionPercentage !== undefined ? `${c.commissionPercentage}%` : 'Default (10%)'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        const rate = prompt(`Enter new commission % for ${c.name}:`, c.commissionPercentage || 10);
                        if (rate !== null && !isNaN(rate)) {
                          handleUpdateCategoryCommission(c._id, rate);
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline">
                      Edit %
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order-by-Order Commission Ledger */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Transparent Order Commission Ledger
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Platform Cut</th>
                <th className="py-3 px-4">Merchant Net</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    No order commissions recorded yet.
                  </td>
                </tr>
              ) : (
                ledger.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">#{row.orderId}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{row.sellerName}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      ₹{row.subtotal?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{row.commissionRate}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      ₹{row.commissionEarned?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      ₹{row.netPayableToSeller?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-xs text-gray-500">{row.status}</td>
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

export default Commissions;

