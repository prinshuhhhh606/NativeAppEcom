import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image,
  UploadCloud,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  Star,
  RefreshCw,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import sellerService from '../../services/sellerService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ProductModal = ({ isOpen, onClose, product, onSaved }) => {
  const { seller } = useAuth();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'images' | 'pricing' | 'shipping'
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [offlineDraftAvailable, setOfflineDraftAvailable] = useState(null);

  const [formData, setFormData] = useState({
    productName: '',
    subtitle: '',
    description: '',
    category: '',
    subCategory: '',
    brand: '',
    sku: '',
    images: [],
    price: '',
    originalPrice: '',
    costPrice: '',
    stock: 10,
    lowStockAlert: 5,
    weight: 0.5,
    dimensions: { length: '', width: '', height: '' },
    gstPercentage: 18,
    hsnCode: '',
    transitDays: 3,
    codAvailable: true,
    returnPolicy: { returnable: true, returnPeriodDays: 7 },
    variants: {
      colors: [],
      sizes: [],
    },
    colorInput: '',
    sizeInput: '',
  });

  // Fetch Categories
  useEffect(() => {
    if (isOpen) {
      const fetchCats = async () => {
        try {
          const res = await sellerService.getCategories();
          const list = Array.isArray(res.data) ? res.data : (res.data?.categories || []);
          setCategories(list);
        } catch (e) {
          console.warn('Failed to load categories', e);
        }
      };
      fetchCats();
    }
  }, [isOpen]);

  // Populate data when editing
  useEffect(() => {
    if (product) {
      const catId = product.category?._id || product.category || '';
      setFormData({
        productName: product.productName || '',
        subtitle: product.subtitle || '',
        description: product.description || '',
        category: catId,
        subCategory: product.subCategory || '',
        brand: product.brand || seller?.storeName || '',
        sku: product.sku || '',
        images: product.images && product.images.length > 0 ? [...product.images] : [],
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice !== undefined ? String(product.originalPrice) : '',
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
        stock: product.stock !== undefined ? product.stock : 10,
        lowStockAlert: product.lowStockAlert !== undefined ? product.lowStockAlert : 5,
        weight: product.weight !== undefined ? product.weight : 0.5,
        dimensions: {
          length: product.dimensions?.length || '',
          width: product.dimensions?.width || '',
          height: product.dimensions?.height || '',
        },
        gstPercentage: product.gstPercentage !== undefined ? product.gstPercentage : 18,
        hsnCode: product.hsnCode || '',
        transitDays: product.transitDays || 3,
        codAvailable: product.codAvailable !== undefined ? product.codAvailable : true,
        returnPolicy: {
          returnable: product.returnPolicy?.returnable !== undefined ? product.returnPolicy.returnable : true,
          returnPeriodDays: product.returnPolicy?.returnPeriodDays || 7,
        },
        variants: {
          colors: Array.isArray(product.variants?.colors) ? [...product.variants.colors] : [],
          sizes: Array.isArray(product.variants?.sizes) ? [...product.variants.sizes] : [],
        },
        colorInput: '',
        sizeInput: '',
      });
    } else {
      // Default new product values
      setFormData({
        productName: '',
        subtitle: '',
        description: '',
        category: categories[0]?._id || '',
        subCategory: '',
        brand: seller?.storeName || 'Bharat Bazaar Artisans',
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        ],
        price: '',
        originalPrice: '',
        costPrice: '',
        stock: 10,
        lowStockAlert: 5,
        weight: 0.5,
        dimensions: { length: '', width: '', height: '' },
        gstPercentage: 18,
        hsnCode: '',
        transitDays: 3,
        codAvailable: true,
        returnPolicy: { returnable: true, returnPeriodDays: 7 },
        variants: {
          colors: ['Red', 'Blue'],
          sizes: ['M', 'L', 'XL'],
        },
        colorInput: '',
        sizeInput: '',
      });
    }
    setActiveTab('basic');

    // Check for offline draft if creating a new product
    if (!product && isOpen) {
      try {
        const saved = localStorage.getItem('bb_seller_product_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.productName || parsed.price)) {
            setOfflineDraftAvailable(parsed);
          }
        }
      } catch (e) {}
    } else {
      setOfflineDraftAvailable(null);
    }
  }, [product, isOpen, categories]);

  // Debounced auto-save for new product drafts (Offline draft resilience)
  useEffect(() => {
    if (!product && isOpen && (formData.productName || formData.price)) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('bb_seller_product_draft', JSON.stringify(formData));
        } catch (e) {}
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [formData, product, isOpen]);

  const handleRestoreDraft = () => {
    if (offlineDraftAvailable) {
      setFormData(offlineDraftAvailable);
      setOfflineDraftAvailable(null);
      toast.success('Offline product draft restored successfully!');
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('bb_seller_product_draft');
    setOfflineDraftAvailable(null);
    toast.success('Offline draft discarded');
  };

  // Selected Category's subcategories
  const selectedCategoryObj = categories.find(
    (c) => c._id === formData.category || c.slug === formData.category
  );
  const availableSubcategories = selectedCategoryObj?.subCategories || [];

  // Auto-calculated Discount
  const priceNum = parseFloat(formData.price) || 0;
  const mrpNum = parseFloat(formData.originalPrice) || 0;
  const costNum = parseFloat(formData.costPrice) || 0;

  const discountPercentage =
    mrpNum > priceNum && mrpNum > 0
      ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
      : 0;

  const profitMargin = priceNum > costNum && costNum > 0 ? priceNum - costNum : 0;
  const marginPercentage =
    priceNum > 0 && costNum > 0 ? Math.round((profitMargin / priceNum) * 100) : 0;

  // Auto-generate SKU
  const handleGenerateSku = () => {
    const prefix = (formData.brand || 'BB').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'BB');
    const random = Math.floor(100000 + Math.random() * 900000);
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  // Multiple File Upload Handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate size (max 5MB each)
    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploadingImages(true);
    try {
      const data = new FormData();
      files.forEach((file) => {
        data.append('images', file);
      });

      const res = await sellerService.uploadProductImages(data);
      const uploadedUrls = res.data?.urls || res.urls || [];
      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      }
    } catch (err) {
      toast.error(err.message || 'Image upload failed. Using local preview.');
      // Local preview fallback
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, uploadEvent.target.result],
          }));
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  // Add Image via URL
  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, urlInput.trim()],
    }));
    setUrlInput('');
  };

  // Remove Image
  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Set Primary Image (move to first position)
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const updated = [...formData.images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setFormData((prev) => ({ ...prev, images: updated }));
    toast.success('Set as primary cover image');
  };

  // Variant Chips
  const handleAddColor = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = formData.colorInput.trim();
      if (val && !formData.variants.colors.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          variants: { ...prev.variants, colors: [...prev.variants.colors, val] },
          colorInput: '',
        }));
      }
    }
  };

  const handleRemoveColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        colors: prev.variants.colors.filter((c) => c !== color),
      },
    }));
  };

  const handleAddSize = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = formData.sizeInput.trim().toUpperCase();
      if (val && !formData.variants.sizes.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          variants: { ...prev.variants, sizes: [...prev.variants.sizes, val] },
          sizeInput: '',
        }));
      }
    }
  };

  const handleRemoveSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        sizes: prev.variants.sizes.filter((s) => s !== size),
      },
    }));
  };

  // Submit Handler
  const handleSubmit = async (approvalStatusToSet) => {
    // Basic Form Validation
    if (!formData.productName.trim()) {
      toast.error('Product title/name is required');
      setActiveTab('basic');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Product description is required');
      setActiveTab('basic');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      setActiveTab('basic');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid Selling Price');
      setActiveTab('pricing');
      return;
    }

    const mrp = parseFloat(formData.originalPrice) || parseFloat(formData.price);
    const sellingPrice = parseFloat(formData.price);
    if (sellingPrice > mrp) {
      toast.error('Selling price cannot exceed Original MRP');
      setActiveTab('pricing');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload or provide at least one product image');
      setActiveTab('images');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subCategory: formData.subCategory.trim(),
        brand: formData.brand.trim() || seller?.storeName || 'Bharat Bazaar',
        sku: formData.sku.trim().toUpperCase(),
        images: formData.images,
        price: sellingPrice,
        originalPrice: mrp,
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert, 10) || 5,
        weight: parseFloat(formData.weight) || 0.5,
        dimensions: {
          length: parseFloat(formData.dimensions.length) || 0,
          width: parseFloat(formData.dimensions.width) || 0,
          height: parseFloat(formData.dimensions.height) || 0,
        },
        gstPercentage: parseFloat(formData.gstPercentage) || 18,
        hsnCode: formData.hsnCode.trim(),
        transitDays: parseInt(formData.transitDays, 10) || 3,
        codAvailable: formData.codAvailable,
        returnPolicy: formData.returnPolicy,
        variants: formData.variants,
        isDraft: approvalStatusToSet === 'draft',
        approvalStatus: approvalStatusToSet === 'draft' ? 'draft' : 'approved',
      };

      if (product?._id) {
        await sellerService.updateProduct(product._id, payload);
        toast.success(
          approvalStatusToSet === 'draft'
            ? 'Product updated and saved as Draft'
            : 'Product updated and published directly to store!'
        );
      } else {
        await sellerService.createProduct(payload);
        try {
          localStorage.removeItem('bb_seller_product_draft');
        } catch (e) {}
        toast.success(
          approvalStatusToSet === 'draft'
            ? 'Product saved as Draft'
            : 'Product published directly to your store!'
        );
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '1. Basic Info', icon: Info },
    { id: 'images', label: '2. Images & Media', icon: Image },
    { id: 'pricing', label: '3. Pricing & Inventory', icon: DollarSign },
    { id: 'shipping', label: '4. Variants & Shipping', icon: Truck },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Seller Product' : 'Add New Product to Store Catalog'}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Offline Draft Recovery Notice */}
        {offlineDraftAvailable && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-amber-900 dark:text-amber-200 font-medium">
                Unsaved offline draft found for: <strong className="font-bold">{offlineDraftAvailable.productName || 'Untitled Product'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-2.5 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 font-semibold transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 -mx-6 px-6 overflow-x-auto scrollbar-none gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Product Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Royal Jaipuri Pure Bandhani Silk Saree with Zari Border"
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Subtitle / Catchphrase
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Authentic Handcrafted Tie & Dye"
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder={seller?.storeName || 'e.g. Bharat Bazaar Artisans'}
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value, subCategory: '' })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name || cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Subcategory
                  </label>
                  {availableSubcategories.length > 0 ? (
                    <select
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Subcategory</option>
                      {availableSubcategories.map((sub, i) => (
                        <option key={i} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      placeholder="e.g. Sarees & Ethnic"
                      className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* SKU & Code */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    SKU (Stock Keeping Unit)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate SKU</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. JHP-SAR-001"
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Product Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide comprehensive details about materials, care instructions, origin, craftsmanship..."
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Upload Dropzone */}
              <div className="p-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-900/40 text-center hover:border-emerald-500 transition-colors">
                <UploadCloud className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Upload Product Photography
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Supports JPG, JPEG, PNG, WEBP (Max 5MB each). Multiple files allowed.
                </p>

                <div className="mt-4 flex justify-center">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Select Images from Computer</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
                {uploadingImages && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading images to cloud storage...</span>
                  </div>
                )}
              </div>

              {/* Direct URL input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste an image web URL (https://...)..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Add URL
                </button>
              </div>

              {/* Image Previews Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Uploaded Gallery ({formData.images.length} images)
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Tip: The first image will be your main product thumbnail.
                  </span>
                </div>

                {formData.images.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs rounded-xl bg-gray-50 dark:bg-slate-900">
                    No images added yet. Please upload at least one image.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-gray-100 dark:bg-slate-900 transition-all ${
                          index === 0
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />

                        {/* Primary Badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Star className="w-3 h-3 fill-white" />
                            <span>Cover</span>
                          </div>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(index)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-md hover:bg-emerald-700 transition-colors w-full"
                            >
                              Set as Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold shadow-md hover:bg-rose-700 transition-colors flex items-center justify-center gap-1 w-full"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & INVENTORY */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Selling Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="1499"
                      className="block w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Original Price / MRP (INR)
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="1999"
                      className="block w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Cost Price (Internal)
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="850 (Optional)"
                      className="block w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Real-Time Price Calculation Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600 dark:text-gray-300">Discount Offered:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                    {discountPercentage}% OFF
                  </span>
                </div>

                {costNum > 0 && priceNum > costNum && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600 dark:text-gray-300">Estimated Margin:</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                      ₹{profitMargin.toLocaleString('en-IN')} ({marginPercentage}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Inventory & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Available Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.lowStockAlert}
                    onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
                    placeholder="5"
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    System triggers an alert when stock reaches this level.
                  </p>
                </div>
              </div>

              {/* Tax & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Applicable GST Slab (%)
                  </label>
                  <select
                    value={formData.gstPercentage}
                    onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={0}>0% (Tax Exempted)</option>
                    <option value={5}>5% (Standard Apparel & Textiles)</option>
                    <option value={12}>12% (Standard Goods)</option>
                    <option value={18}>18% (Standard Electronics & Accessories)</option>
                    <option value={28}>28% (Luxury Goods)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="e.g. 5208 / 6204"
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VARIANTS & SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              {/* Color Variants Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Color Options (Press Enter to add)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.colorInput}
                    onChange={(e) => setFormData({ ...formData, colorInput: e.target.value })}
                    onKeyDown={handleAddColor}
                    placeholder="Type color e.g. Crimson Red..."
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                {formData.variants.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.variants.colors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(c)}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Size Variants Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Size Options (Press Enter to add)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sizeInput}
                    onChange={(e) => setFormData({ ...formData, sizeInput: e.target.value })}
                    onKeyDown={handleAddSize}
                    placeholder="Type size e.g. M, L, XL, Free Size..."
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                {formData.variants.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.variants.sizes.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(s)}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Weight & Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="0.5"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, length: e.target.value },
                      })
                    }
                    placeholder="25"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, width: e.target.value },
                      })
                    }
                    placeholder="15"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, height: e.target.value },
                      })
                    }
                    placeholder="5"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Shipping & COD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Transit Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.transitDays}
                    onChange={(e) => setFormData({ ...formData, transitDays: e.target.value })}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="codToggle"
                    checked={formData.codAvailable}
                    onChange={(e) => setFormData({ ...formData, codAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <label
                    htmlFor="codToggle"
                    className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
                  >
                    Cash on Delivery (COD) Allowed
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="returnToggle"
                    checked={formData.returnPolicy.returnable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        returnPolicy: { ...formData.returnPolicy, returnable: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <label
                    htmlFor="returnToggle"
                    className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
                  >
                    7 Days Return Policy Applicable
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="border-t border-gray-100 dark:border-slate-700 pt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('draft')}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('approved')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{product ? 'Save & Update Product' : 'Publish Product to Store'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProductModal;
