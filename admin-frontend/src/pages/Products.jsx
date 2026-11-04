import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  Star,
  TrendingUp,
  X,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Store,
  User,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get('status') || 'all');
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add/Edit Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    brand: '',
    stock: '',
    sku: '',
    images: '',
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
  });

  // Admin Compliance Review Modal state
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReviewImage, setActiveReviewImage] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sync approvalFilter if URL query param changes
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== approvalFilter) {
      setApprovalFilter(urlStatus);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchPendingCount();
  }, [page, categoryFilter, stockFilter, approvalFilter]);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/seller-products/pending?limit=1');
      setPendingCount(res.pagination?.totalCount || res.totalCount || 0);
    } catch (e) {
      // ignore
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `/products?page=${page}&limit=12`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (stockFilter) query += `&stockStatus=${stockFilter}`;
      if (approvalFilter && approvalFilter !== 'all') {
        query += `&approvalStatus=${approvalFilter}`;
      }

      const res = await api.get(query);
      setProducts(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        name: prod.productName || prod.name || '',
        description: prod.description || '',
        price: prod.price,
        discountPrice: prod.discountPrice || prod.originalPrice || '',
        category: prod.category?._id || prod.category || '',
        brand: prod.brand || '',
        stock: prod.stock,
        sku: prod.sku,
        images: prod.images?.join(', ') || '',
        isFeatured: prod.isFeatured || false,
        isTrending: prod.isTrending || false,
        isBestSeller: prod.isBestSeller || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: categories[0]?._id || '',
        brand: '',
        stock: '50',
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
        isTrending: false,
        isBestSeller: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        stock: Number(formData.stock),
        images: formData.images.split(',').map((u) => u.trim()).filter(Boolean),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully!');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleToggleFlag = async (id, field) => {
    try {
      const res = await api.patch(`/products/${id}/toggle`, { field });
      toast.success(res.message);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, [field]: !p[field] } : p))
      );
    } catch (err) {
      toast.error(err.message || 'Toggle failed');
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/v1/admin/products/export/csv', '_blank');
  };

  // Open Review & Approval Dialog
  const handleOpenReview = (product) => {
    setReviewingProduct(product);
    setActiveReviewImage(
      product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
    );
    setShowRejectInput(false);
    setRejectionReason('');
    setIsReviewModalOpen(true);
  };

  // Approve Product Handler
  const handleApproveProduct = async (id) => {
    setActionLoading(true);
    try {
      await api.patch(`/seller-products/${id}/approval`, { decision: 'approved' });
      toast.success('Product approved and published to store successfully!');
      setIsReviewModalOpen(false);
      setReviewingProduct(null);
      fetchProducts();
      fetchPendingCount();
    } catch (err) {
      toast.error(err.message || 'Failed to approve product');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Product Handler
  const handleRejectProduct = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('A rejection reason is mandatory when rejecting a product');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/seller-products/${id}/approval`, {
        decision: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Product rejected and feedback sent to seller');
      setIsReviewModalOpen(false);
      setReviewingProduct(null);
      setShowRejectInput(false);
      setRejectionReason('');
      fetchProducts();
      fetchPendingCount();
    } catch (err) {
      toast.error(err.message || 'Failed to reject product');
    } finally {
      setActionLoading(false);
    }
  };

  const approvalTabs = [
    { id: 'all', label: 'All Catalog' },
    {
      id: 'pending',
      label: 'Pending Approval',
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'approved', label: 'Live on Store' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'draft', label: 'Drafts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Product Catalog & Approvals
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Review seller submissions, verify product compliance, pricing, inventory, and manage live listings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-1.5 shadow-sm"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center space-x-1.5 shadow-sm shadow-blue-500/30"
          >
            <Plus size={16} />
            <span>Add Admin Product</span>
          </button>
        </div>
      </div>

      {/* Compliance Approval Status Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
        {approvalTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setApprovalFilter(tab.id);
              setPage(1);
              if (tab.id === 'all') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', tab.id);
              }
              setSearchParams(searchParams, { replace: true });
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              approvalFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search by product name, SKU, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          />
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name || c.categoryName}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Seller / Store</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Store Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    No products found matching filters
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isPending =
                    p.approvalStatus === 'pending' || p.approvalStatus === 'pending_approval';
                  const isApproved = p.approvalStatus === 'approved';
                  const isRejected = p.approvalStatus === 'rejected';

                  return (
                    <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.images?.[0] || 'https://via.placeholder.com/60'}
                            alt={p.productName || p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-slate-700 shrink-0"
                          />
                          <div className="max-w-xs">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {p.productName || p.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              SKU: {p.sku || 'N/A'} {p.brand ? `• ${p.brand}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                        {p.category?.name || p.category?.categoryName || 'Uncategorized'}
                      </td>

                      {/* Seller Information */}
                      <td className="py-3 px-4">
                        {p.seller ? (
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                              <Store size={12} className="text-gray-400" />
                              <span>{p.seller.storeName || p.seller.name || 'Store'}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[130px]">
                              {p.seller.email || p.seller.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold italic">
                            Platform Native
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-gray-900 dark:text-white">
                          ₹{p.price?.toLocaleString('en-IN') || 0}
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{p.originalPrice?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : p.stock <= 10
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      {/* Compliance Approval Status */}
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <Clock size={11} />
                            <span>Pending Review</span>
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle size={11} />
                            <span>Approved</span>
                          </span>
                        ) : isRejected ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                              <XCircle size={11} />
                              <span>Rejected</span>
                            </span>
                            {p.rejectionReason && (
                              <p className="text-[10px] text-rose-500 font-semibold line-clamp-1 max-w-[130px]">
                                {p.rejectionReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Store Visibility Flag */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                          }`}
                        >
                          {p.isActive ? 'Live' : 'Hidden'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Dedicated Review & Decision button for pending submissions */}
                          {isPending && (
                            <button
                              onClick={() => handleOpenReview(p)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm shadow-blue-500/20"
                              title="Review Seller Product"
                            >
                              <ShieldCheck size={13} />
                              <span>Review</span>
                            </button>
                          )}

                          {/* Quick Inspect View */}
                          <button
                            onClick={() => handleOpenReview(p)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => handleOpenModal(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.productName || p.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Compliance & Product Approval Review Modal */}
      {isReviewModalOpen && reviewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 border border-gray-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Product Compliance & Admin Review
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {reviewingProduct._id} • SKU: {reviewingProduct.sku || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-5">
              {/* Left Column: Image Previews */}
              <div className="md:col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                  <img
                    src={activeReviewImage}
                    alt={reviewingProduct.productName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {reviewingProduct.images && reviewingProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {reviewingProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveReviewImage(img)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeReviewImage === img
                            ? 'border-blue-600 shadow-md scale-105'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Seller Store Card */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Seller & Store Info
                  </span>
                  {reviewingProduct.seller ? (
                    <div>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center space-x-1.5">
                        <Store size={15} className="text-blue-500" />
                        <span>
                          {reviewingProduct.seller.storeName || reviewingProduct.seller.name}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Email: {reviewingProduct.seller.email}
                      </p>
                      {reviewingProduct.seller.phone && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Phone: {reviewingProduct.seller.phone}
                        </p>
                      )}
                      {reviewingProduct.seller.businessName && (
                        <p className="text-xs text-gray-500">
                          Legal Entity: {reviewingProduct.seller.businessName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Platform Direct Listing (No external vendor)
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Specifications & Pricing */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
                    {reviewingProduct.category?.name ||
                      reviewingProduct.category?.categoryName ||
                      'General Category'}
                  </span>
                  {reviewingProduct.brand && (
                    <span className="ml-2 px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-[11px] font-semibold">
                      Brand: {reviewingProduct.brand}
                    </span>
                  )}
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mt-1.5">
                    {reviewingProduct.productName || reviewingProduct.name}
                  </h2>
                  {reviewingProduct.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reviewingProduct.subtitle}
                    </p>
                  )}
                </div>

                {/* Pricing & Stock Grid */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Selling Price
                    </span>
                    <p className="text-base font-black text-gray-900 dark:text-white">
                      ₹{reviewingProduct.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Original MRP
                    </span>
                    <p className="text-sm font-bold text-gray-500 line-through">
                      ₹{reviewingProduct.originalPrice?.toLocaleString('en-IN') || reviewingProduct.price}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Stock Count
                    </span>
                    <p className="text-base font-black text-emerald-600">
                      {reviewingProduct.stock} units
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Product Description
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line p-3 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                    {reviewingProduct.description || 'No description provided.'}
                  </p>
                </div>

                {/* Compliance Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-bold">HSN & TAX:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      HSN: {reviewingProduct.hsnCode || 'N/A'} • GST: {reviewingProduct.gstPercentage || 18}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-bold">SHIPPING & WEIGHT:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      Weight: {reviewingProduct.weight || 0.5} kg • Transit: {reviewingProduct.transitDays || 3} days
                    </p>
                  </div>
                </div>

                {/* Existing Rejection Notice */}
                {reviewingProduct.approvalStatus === 'rejected' && reviewingProduct.rejectionReason && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        Previously Rejected Reason
                      </p>
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                        {reviewingProduct.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Inline Rejection Reason Prompt */}
                {showRejectInput && (
                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                    <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
                      Enter Mandatory Rejection Reason *
                    </label>
                    <textarea
                      rows="3"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain to the seller why this product was rejected (e.g., poor image quality, prohibited brand name, pricing discrepancy)..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-gray-800 dark:text-white"
                    />

                    {/* Quick Reasons Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Low-resolution product images',
                        'Incomplete product specifications',
                        'Selling price exceeds verified MRP',
                        'Prohibited or restricted merchandise',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRejectionReason(chip)}
                          className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 text-rose-800 dark:text-rose-300 text-[10px] font-semibold transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading || !rejectionReason.trim()}
                        onClick={() => handleRejectProduct(reviewingProduct._id)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-600/30 disabled:opacity-50"
                      >
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Close View
              </button>

              <div className="flex items-center space-x-2">
                {!showRejectInput && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowRejectInput(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold text-xs transition-colors"
                  >
                    <XCircle size={15} />
                    <span>Reject Product</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproveProduct(reviewingProduct._id)}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle size={15} />
                  <span>{actionLoading ? 'Approving...' : 'Approve & Publish to Store'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Traditional Handloom Cotton Saree"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name || c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Brand or Artisan name"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="1499"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-10029"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Image URLs (Comma-separated) *
                </label>
                <textarea
                  required
                  rows="2"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..., https://..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of the item..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Featured</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Trending</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Best Seller</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/30"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
