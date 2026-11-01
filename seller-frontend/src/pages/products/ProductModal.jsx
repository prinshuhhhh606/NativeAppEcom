import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image, Layers, Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const ProductModal = ({ isOpen, onClose, product, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    subtitle: '',
    description: '',
    highlights: '',
    price: '',
    originalPrice: '',
    stock: '',
    sku: '',
    gstPercentage: 5,
    hsnCode: '',
    weight: 0.5,
    images: [''],
    variants: {
      colors: '',
      sizes: '',
    },
    approvalStatus: 'pending_approval',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        subtitle: product.subtitle || '',
        description: product.description || '',
        highlights: Array.isArray(product.highlights) ? product.highlights.join(', ') : '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        stock: product.stock !== undefined ? product.stock : '',
        sku: product.sku || '',
        gstPercentage: product.gstPercentage || 5,
        hsnCode: product.hsnCode || '',
        weight: product.weight || 0.5,
        images: product.images && product.images.length > 0 ? product.images : [''],
        variants: {
          colors: product.variants?.colors ? product.variants.colors.join(', ') : '',
          sizes: product.variants?.sizes ? product.variants.sizes.join(', ') : '',
        },
        approvalStatus: product.approvalStatus || 'pending_approval',
      });
    } else {
      setFormData({
        productName: '',
        subtitle: '',
        description: '',
        highlights: '',
        price: '',
        originalPrice: '',
        stock: '',
        sku: '',
        gstPercentage: 5,
        hsnCode: '',
        weight: 0.5,
        images: [''],
        variants: {
          colors: '',
          sizes: '',
        },
        approvalStatus: 'pending_approval',
      });
    }
  }, [product, isOpen]);

  const handleImageChange = (index, value) => {
    const updated = [...formData.images];
    updated[index] = value;
    setFormData({ ...formData, images: updated });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImageField = (index) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated.length ? updated : [''] });
  };

  const handleSubmit = async (statusToSet) => {
    if (!formData.productName || !formData.price) {
      toast.error('Please enter product title and price');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName,
        subtitle: formData.subtitle,
        description: formData.description,
        highlights: formData.highlights ? formData.highlights.split(',').map((s) => s.trim()) : [],
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        stock: Number(formData.stock) || 0,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        gstPercentage: Number(formData.gstPercentage),
        hsnCode: formData.hsnCode,
        weight: Number(formData.weight) || 0.5,
        images: formData.images.filter((img) => img.trim().length > 0),
        variants: {
          colors: formData.variants.colors ? formData.variants.colors.split(',').map((s) => s.trim()) : [],
          sizes: formData.variants.sizes ? formData.variants.sizes.split(',').map((s) => s.trim()) : [],
        },
        approvalStatus: statusToSet,
      };

      if (product?._id) {
        await sellerService.updateProduct(product._id, payload);
        toast.success('Product updated successfully!');
      } else {
        await sellerService.createProduct(payload);
        toast.success(
          statusToSet === 'pending_approval'
            ? 'Product submitted to Admin compliance for catalog review!'
            : 'Product saved as Draft'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Catalog Product' : 'Add New Product to Catalog'}
      maxWidth="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Name and Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Product Title / Name *
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g. Royal Jaipuri Pure Bandhani Silk Saree"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Subtitle / Catchline
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Handcrafted with authentic Rai Bandhej dots"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. JH-SAR-001"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono uppercase text-sm"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Selling Price (INR) *
            </label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">₹</span>
              <input
                type="number"
                required
                min={1}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2499"
                className="block w-full pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              MRP / Original Price (INR)
            </label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">₹</span>
              <input
                type="number"
                min={1}
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="3999"
                className="block w-full pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Initial Stock Quantity *
            </label>
            <input
              type="number"
              required
              min={0}
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="50"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* GST & Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              GST Slab Rate *
            </label>
            <select
              value={formData.gstPercentage}
              onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
              className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            >
              <option value={0}>0% (Exempt)</option>
              <option value={5}>5% (Apparel/Handlooms)</option>
              <option value={12}>12% (Handicrafts/Decor)</option>
              <option value={18}>18% (Standard Goods)</option>
              <option value={28}>28% (Luxury)</option>
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
              placeholder="e.g. 5208"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Package Weight (Kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="0.5"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Variants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Color Variants (comma-separated)
            </label>
            <input
              type="text"
              value={formData.variants.colors}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  variants: { ...formData.variants, colors: e.target.value },
                })
              }
              placeholder="Red, Royal Blue, Emerald Green"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Size Options (comma-separated)
            </label>
            <input
              type="text"
              value={formData.variants.sizes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  variants: { ...formData.variants, sizes: e.target.value },
                })
              }
              placeholder="Free Size, M, L, XL"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Product Images */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Product Images (Image URLs)
            </label>
            <button
              type="button"
              onClick={addImageField}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Image
            </button>
          </div>

          <div className="space-y-2">
            {formData.images.map((img, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={img}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-xs"
                />
                {img && (
                  <img
                    src={img}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-slate-700"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description & Key Highlights */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description highlighting craftsmanship, fabric, care instructions..."
            className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('draft')}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('pending_approval')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit for Admin Catalog Review →'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;

