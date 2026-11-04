import React from 'react';
import {
  X,
  Package,
  Tag,
  Layers,
  IndianRupee,
  Truck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Send,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export const ProductViewModal = ({
  isOpen,
  onClose,
  product,
  isSubmitting = false,
  onEdit,
  onDelete,
  onSubmitForApproval,
}) => {
  if (!product) return null;

  const [activeImage, setActiveImage] = React.useState(
    product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
  );

  React.useEffect(() => {
    if (product?.images?.[0]) {
      setActiveImage(product.images[0]);
    }
  }, [product]);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const categoryName =
    product.category?.name || product.category?.categoryName || product.category || 'General';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details & Compliance View"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Images Section (Left 5 Cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 shadow-inner">
              <img
                src={activeImage}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <StatusBadge status={product.approvalStatus || 'approved'} size="sm" />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImage === img
                        ? 'border-emerald-600 shadow-md scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section (Right 7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  {categoryName}
                </span>
                {product.subCategory && (
                  <span className="text-xs text-gray-400">/ {product.subCategory}</span>
                )}
                <span className="ml-auto font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  SKU: {product.sku || 'N/A'}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-2">
                {product.productName}
              </h2>
              {product.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {product.subtitle}
                </p>
              )}
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
                Brand: <span className="text-emerald-600 dark:text-emerald-400">{product.brand || 'Bharat Bazaar'}</span>
              </p>
            </div>

            {/* Pricing Card */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Selling Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    ₹{product.price?.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.originalPrice?.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Inventory Stock
                </span>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-xl text-xs font-bold ${
                    product.stock === 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : product.stock <= (product.lowStockAlert || 5)
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : `${product.stock} units available`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Description
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-24 overflow-y-auto">
                {product.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">Weight</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{product.weight || 0.5} kg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">GST Rate</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{product.gstPercentage || 18}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">HSN Code</span>
                <span className="font-bold font-mono text-gray-800 dark:text-gray-200">{product.hsnCode || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">Delivery Transit</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{product.transitDays || 3} Days</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">COD Available</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{product.codAvailable ? 'Yes' : 'No'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 block font-semibold">Return Policy</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {product.returnPolicy?.returnable ? `${product.returnPolicy.returnPeriodDays || 7} Days Return` : 'Non-returnable'}
                </span>
              </div>
            </div>

            {/* Variants */}
            {((product.variants?.colors && product.variants.colors.length > 0) ||
              (product.variants?.sizes && product.variants.sizes.length > 0)) && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Product Variants
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.colors?.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-semibold"
                    >
                      Color: {c}
                    </span>
                  ))}
                  {product.variants.sizes?.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold"
                    >
                      Size: {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Alert */}
            {product.approvalStatus === 'rejected' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Compliance Review Rejected
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                    {product.rejectionReason || 'Please review image quality, pricing or descriptions and resubmit.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete(product._id, product.productName);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Product</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(product.approvalStatus === 'draft' || product.approvalStatus === 'rejected') && (
              <button
                disabled={isSubmitting}
                onClick={() => onSubmitForApproval(product._id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductViewModal;

