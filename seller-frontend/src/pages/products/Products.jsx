import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Send,
  Boxes,
  Layers,
  ArrowUpDown,
  Barcode,
  LayoutGrid,
  List,
  Tag,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import ProductModal from './ProductModal';
import ProductViewModal from './ProductViewModal';
import BarcodeScannerModal from '../../components/common/BarcodeScannerModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Products = () => {
  const { isApproved } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  // Check if routed with action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add' && isApproved) {
      setEditingProduct(null);
      setIsModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isApproved]);

  // Load Categories for filter
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await sellerService.getCategories();
        const list = Array.isArray(res.data) ? res.data : (res.data?.categories || []);
        setCategories(list);
      } catch (e) {
        console.warn('Failed to load categories for filter', e);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await sellerService.getProducts(params);
      const productList = Array.isArray(res.data)
        ? res.data
        : res.data?.products || (Array.isArray(res) ? res : []);
      setProducts(productList);
    } catch (err) {
      toast.error('Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedStatus, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenView = (product) => {
    setViewingProduct(product);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your catalog?`)) return;
    try {
      await sellerService.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleSubmitForApproval = async (id) => {
    if (submittingId) return; // Prevent duplicate rapid clicks
    setSubmittingId(id);
    try {
      await sellerService.submitProductForApproval(id);
      toast.success('Product submitted successfully for admin review.');
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to submit product for approval');
    } finally {
      setSubmittingId(null);
    }
  };

  // Status Tab Definitions
  const statusTabs = [
    { id: 'all', label: 'All Products' },
    { id: 'approved', label: 'Live on Store' },
    { id: 'draft', label: 'Drafts' },
    { id: 'pending', label: 'In Review' },
    { id: 'rejected', label: 'Rejected' },
  ];

  // Catalog Metrics
  const totalCount = products.length;
  const liveCount = products.filter((p) => p.approvalStatus === 'approved').length;
  const pendingCount = products.filter(
    (p) => p.approvalStatus === 'pending' || p.approvalStatus === 'pending_approval'
  ).length;
  const lowStockCount = products.filter((p) => p.stock <= (p.lowStockAlert || 5)).length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Product Catalog
                </h1>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Direct Publishing Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isApproved
                  ? 'Your seller account is verified. Every new product publishes directly to the marketplace.'
                  : 'Manage inventory, set pricing, upload media, and monitor compliance status.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid View (Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Table View (List)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setShowBarcodeModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold text-xs shadow-xs transition-all"
            title="Barcode and SKU Label Scanner / Printer"
          >
            <Barcode className="w-4 h-4 text-purple-600" />
            <span>Barcodes & Labels</span>
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={!isApproved}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            title={!isApproved ? 'Account approval required before uploading catalog' : ''}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards - Colorful Gradients */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Catalog */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Products
              </span>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Full Catalog Directory</span>
          </div>
        </div>

        {/* Live on Store */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Live on Store
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {liveCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ready for Customer Purchases</span>
          </div>
        </div>

        {/* In Review */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                In Review / Draft
              </span>
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {pendingCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Awaiting Compliance Audit</span>
          </div>
        </div>

        {/* Low / Out Stock */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Low / Out of Stock
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                {lowStockCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Restock Inventory Action</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Category Dropdown & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
        {/* Status Filter Tabs with Colorful Active Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* Category Dropdown */}
          <div className="min-w-[190px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📁 All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by title, SKU, brand or description..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl text-xs font-extrabold transition-colors shadow-xs"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRODUCTS DISPLAY: GRID VIEW (CARDS) OR TABLE VIEW             */}
      {/* ============================================================== */}
      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-gray-100 dark:border-slate-700/80 animate-pulse space-y-3"
            >
              <div className="w-full h-44 rounded-2xl bg-gray-200 dark:bg-slate-700" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="flex justify-between pt-2">
                <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        // Empty State
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-12 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-4xl mb-4 shadow-inner">
              📦
            </div>
            <h3 className="font-black text-lg text-gray-900 dark:text-white">
              No Products Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
              {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all'
                ? 'Try clearing your filters or search keywords to see matching catalog items.'
                : 'Start listing your inventory to reach millions of active buyers on our marketplace.'}
            </p>
            <button
              onClick={handleOpenAdd}
              disabled={!isApproved}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              + Add Your First Product
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ============================================================== */
        /* A. GRID VIEW: BEAUTIFUL PRODUCT CARDS                          */
        /* ============================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => {
            const coverImage =
              p.images?.[0] ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
            const catTitle =
              p.category?.name || p.category?.categoryName || p.category || 'General';
            const isLowStock = p.stock <= (p.lowStockAlert || 5) && p.stock > 0;
            const isOutOfStock = p.stock === 0;
            const discountPercent =
              p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : null;

            return (
              <div
                key={p._id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Image & Top Badges */}
                <div className="relative aspect-4/3 w-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={coverImage}
                    alt={p.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Pill Overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                      {catTitle}
                    </span>
                  </div>

                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={p.approvalStatus || 'approved'} size="sm" />
                  </div>

                  {/* Discount Badge */}
                  {discountPercent && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white font-black text-[10px] shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Brand or SKU */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-1">
                      <span>{p.brand || 'AppEcom Official'}</span>
                      <span>SKU: {p.sku || 'N/A'}</span>
                    </div>

                    {/* Product Title */}
                    <h3
                      onClick={() => handleOpenView(p)}
                      className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                      title={p.productName}
                    >
                      {p.productName}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {p.subtitle || p.description || 'Authentic multi-vendor catalog product'}
                    </p>
                  </div>

                  {/* Pricing & Stock Status */}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                          ₹{p.price?.toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{p.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Pill */}
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide uppercase ${
                        isOutOfStock
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
                          : isLowStock
                          ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 border border-orange-200 dark:border-orange-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
                        ? `Low: ${p.stock}`
                        : `Stock: ${p.stock}`}
                    </span>
                  </div>

                  {/* Rejection notice if any */}
                  {p.approvalStatus === 'rejected' && p.rejectionReason && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[10px] text-rose-600 font-bold border border-rose-100">
                      Reason: {p.rejectionReason}
                    </div>
                  )}

                  {/* Action Icons Row */}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleOpenView(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View</span>
                    </button>

                    {/* Submit for review button (if draft or rejected) */}
                    {(p.approvalStatus === 'draft' || p.approvalStatus === 'rejected') && (
                      <button
                        disabled={submittingId === p._id || p.approvalStatus === 'pending'}
                        onClick={() => handleSubmitForApproval(p._id)}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors disabled:opacity-40"
                        title={submittingId === p._id ? 'Submitting...' : 'Submit for Review'}
                      >
                        {submittingId === p._id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(p._id, p.productName)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================== */
        /* B. TABLE VIEW                                                 */
        /* ============================================================== */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-500 uppercase tracking-wider font-extrabold">
                  <th className="py-4 px-5">Product Details</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">SKU</th>
                  <th className="py-4 px-4">Price (INR)</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Compliance Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
                {products.map((p) => {
                  const coverImage =
                    p.images?.[0] ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
                  const catTitle =
                    p.category?.name || p.category?.categoryName || p.category || 'General';
                  const isLowStock = p.stock <= (p.lowStockAlert || 5) && p.stock > 0;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Product Details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={coverImage}
                            alt=""
                            className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 shrink-0 shadow-xs"
                          />
                          <div>
                            <p
                              onClick={() => handleOpenView(p)}
                              className="font-black text-gray-900 dark:text-white line-clamp-1 max-w-[240px] cursor-pointer hover:text-blue-600 transition-colors"
                            >
                              {p.productName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                              {p.subtitle || p.brand}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-gray-300 font-extrabold text-[11px]">
                          {catTitle}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                        {p.sku || 'N/A'}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                            ₹{p.price?.toLocaleString('en-IN')}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹{p.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl font-bold text-[11px] ${
                            isOutOfStock
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
                              : isLowStock
                              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 border border-orange-200 dark:border-orange-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? `Low (${p.stock})`
                            : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={p.approvalStatus || 'approved'} size="sm" />
                          {p.approvalStatus === 'rejected' && p.rejectionReason && (
                            <p className="text-[10px] text-rose-500 font-semibold line-clamp-1 max-w-[160px]">
                              {p.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(p)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(p.approvalStatus === 'draft' || p.approvalStatus === 'rejected') && (
                            <button
                              disabled={submittingId === p._id || p.approvalStatus === 'pending'}
                              onClick={() => handleSubmitForApproval(p._id)}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
                              title={submittingId === p._id ? 'Submitting...' : 'Submit for Review'}
                            >
                              {submittingId === p._id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p._id, p.productName)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaved={fetchProducts}
      />

      {/* View Product Details Modal */}
      <ProductViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        product={viewingProduct}
        isSubmitting={submittingId === viewingProduct?._id}
        onEdit={(p) => {
          setIsViewModalOpen(false);
          handleOpenEdit(p);
        }}
        onDelete={(id, name) => {
          setIsViewModalOpen(false);
          handleDelete(id, name);
        }}
        onSubmitForApproval={async (id) => {
          await handleSubmitForApproval(id);
          setIsViewModalOpen(false);
        }}
      />

      {/* Barcode Scanner & SKU Label Print Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeModal}
        onClose={() => {
          setShowBarcodeModal(false);
          fetchProducts();
        }}
        onStockUpdated={fetchProducts}
      />
    </div>
  );
};

export default Products;