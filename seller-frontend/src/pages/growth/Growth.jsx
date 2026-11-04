import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Tag,
  Sparkles,
  Ticket,
  Calendar,
  Gift,
  Copy,
  Plus,
  RefreshCw,
  CheckCircle2,
  Users,
  Lightbulb,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Growth = () => {
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // New Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 999,
  });

  // AI Copy Generator State
  const [aiForm, setAiForm] = useState({
    productName: '',
    category: 'Fashion & Apparel',
    keyFeatures: 'Pure cotton, handwoven, breathable, indigo dye',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getCampaigns();
      setCampaignData(res.data);
    } catch (err) {
      toast.error('Failed to load growth campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) {
      toast.error('Coupon code and discount are required');
      return;
    }

    try {
      await sellerService.createCoupon(couponForm);
      toast.success('Store voucher created successfully!');
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 999,
      });
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleGenerateAiCopy = async (e) => {
    e.preventDefault();
    if (!aiForm.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await sellerService.generateAiCopy(aiForm);
      setAiResult(res.data);
      toast.success('AI e-commerce copy generated!');
    } catch (err) {
      toast.error(err.message || 'AI copy generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const coupons = campaignData?.coupons || [];
  const campaigns = campaignData?.campaigns || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Business Growth & Marketing Center</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Boost customer conversion with store vouchers, festive campaigns, and AI-assisted copywriting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-extrabold text-xs hover:bg-purple-100 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Copywriting Studio</span>
          </button>

          <button
            onClick={() => setIsCouponModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Store Coupon</span>
          </button>
        </div>
      </div>

      {/* Featured Growth Initiatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-5 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/60 flex items-start justify-between gap-4 shadow-sm"
          >
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider inline-block">
                {camp.badge}
              </span>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white mt-1">
                {camp.title}
              </h3>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {camp.discount}
              </p>
              <p className="text-[11px] text-gray-400">
                Active on {camp.participatingProducts} catalog products • Ends in 14 days
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-black">
              {camp.status}
            </span>
          </div>
        ))}
      </div>

      {/* Store Coupons Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Active Store Vouchers & Promos ({coupons.length})
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Custom discount codes displayed on your Bharat Bazaar storefront
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">Coupon Code</th>
                <th className="py-3.5 px-4">Discount Offered</th>
                <th className="py-3.5 px-4">Min Order (INR)</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading coupons...</span>
                  </td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-600 dark:text-gray-300">
                      ₹{c.minOrderValue?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'No Expiry'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => copyToClipboard(c.code)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    <Ticket className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      No Active Store Coupons
                    </p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      Create percentage or flat discount vouchers to incentivize customer checkouts.
                    </p>
                    <button
                      onClick={() => setIsCouponModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      + Create First Voucher
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Store Promotional Coupon"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE15"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Discount Type
              </label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              >
                <option value="percentage">Percentage (% OFF)</option>
                <option value="fixed">Flat Amount (₹ OFF)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Value *
              </label>
              <input
                type="number"
                required
                min={1}
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                placeholder="15"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Minimum Order Value (INR)
            </label>
            <input
              type="number"
              min={0}
              value={couponForm.minOrderValue}
              onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
              placeholder="999"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCouponModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Publish Coupon
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Copywriting Studio Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI Copywriting Studio"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleGenerateAiCopy} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={aiForm.productName}
                onChange={(e) => setAiForm({ ...aiForm, productName: e.target.value })}
                placeholder="e.g. Royal Jaipuri Bandhani Silk Saree"
                className="mt-1 block w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Target Category
                </label>
                <input
                  type="text"
                  value={aiForm.category}
                  onChange={(e) => setAiForm({ ...aiForm, category: e.target.value })}
                  placeholder="Fashion & Apparel"
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Artisanal Key Highlights
                </label>
                <input
                  type="text"
                  value={aiForm.keyFeatures}
                  onChange={(e) => setAiForm({ ...aiForm, keyFeatures: e.target.value })}
                  placeholder="Pure silk, zari border, tie & dye"
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{aiLoading ? 'Generating High-Converting Copy...' : 'Generate Marketing Description'}</span>
            </button>
          </form>

          {/* Generated Result */}
          {aiResult && (
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                    Optimized Product Title
                  </span>
                  <button
                    onClick={() => copyToClipboard(aiResult.title)}
                    className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-extrabold text-sm text-gray-900 dark:text-white mt-1">
                  {aiResult.title}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                    Engaging Description
                  </span>
                  <button
                    onClick={() => copyToClipboard(aiResult.description)}
                    className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                  {aiResult.description}
                </p>
              </div>

              {aiResult.highlights && (
                <div>
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
                    Bullet Highlights
                  </span>
                  <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    {aiResult.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Growth;

