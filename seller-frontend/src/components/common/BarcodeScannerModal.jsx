import React, { useState } from 'react';
import {
  Scan,
  Barcode,
  QrCode,
  Search,
  CheckCircle2,
  Printer,
  Plus,
  Minus,
  RefreshCw,
  Package,
  Layers,
} from 'lucide-react';
import Modal from './Modal';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const BarcodeScannerModal = ({ isOpen, onClose, onStockAdjusted }) => {
  const [scannedCode, setScannedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [stockDelta, setStockDelta] = useState(1);
  const [adjusting, setAdjusting] = useState(false);
  const [printPreview, setPrintPreview] = useState(false);

  const handleLookup = async (codeToSearch) => {
    const code = (codeToSearch || scannedCode).trim();
    if (!code) return;

    setLoading(true);
    setProduct(null);
    try {
      const res = await sellerService.lookupProductByBarcode(code);
      setProduct(res.data);
      toast.success('Product found via Barcode / SKU scan!');
    } catch (err) {
      toast.error(err.message || 'No product matching this barcode/SKU in your store');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async (delta) => {
    if (!product) return;
    setAdjusting(true);
    try {
      const res = await sellerService.adjustStockByBarcode({
        code: product.sku,
        delta,
      });
      setProduct((prev) => ({ ...prev, stock: res.data.stock }));
      toast.success(`Inventory stock updated to ${res.data.stock} units!`);
      if (onStockAdjusted) onStockAdjusted();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode & QR Stock Scanner Studio"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Scanner Input Header */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scan className="w-4 h-4 text-emerald-600" />
              Scan Barcode / SKU / QR Code
            </span>
            <span className="text-[11px] text-gray-400">Press Enter after scanning</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Barcode className="absolute inset-y-0 left-0 pl-3.5 my-auto w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                placeholder="Scan with handheld scanner or type SKU e.g. JHP-SAR-001..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !scannedCode.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Lookup</span>
            </button>
          </form>
        </div>

        {/* Product Scanned Card */}
        {product && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover border border-gray-100 dark:border-slate-700 shadow-inner flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md">
                    SKU: {product.sku}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {product.category?.name || product.category?.categoryName || 'General'}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mt-1 line-clamp-1">
                  {product.productName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    ₹{product.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      product.stock === 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                        : product.stock <= 5
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                    }`}
                  >
                    Current Stock: {product.stock} units
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Inventory Adjustment Controls */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Adjust Inventory Stock
                </span>
                <span className="text-[11px] text-gray-400">
                  Update inventory directly at physical shelf
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={adjusting || product.stock <= 0}
                  onClick={() => handleStockAdjust(-1)}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center font-bold text-sm shadow-sm transition-colors disabled:opacity-40"
                  title="Decrement Stock (-1)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-12 text-center font-extrabold text-sm text-gray-900 dark:text-white">
                  {product.stock}
                </span>

                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleStockAdjust(1)}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm transition-colors"
                  title="Increment Stock (+1)"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleStockAdjust(10)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                  title="Add Carton Pack (+10)"
                >
                  +10 Pack
                </button>
              </div>
            </div>

            {/* Printable Barcode Sticker Preview */}
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Standard SKU Barcode Label (Code 128)
              </span>
              <div className="inline-block p-3 bg-white border border-gray-200 rounded-xl shadow-inner text-gray-900">
                <p className="font-extrabold text-[11px] tracking-wider uppercase mb-1">
                  BHARAT BAZAAR VERIFIED PRODUCT
                </p>
                {/* SVG Mock Code 128 Barcode */}
                <svg className="w-56 h-12 mx-auto" viewBox="0 0 200 40">
                  <rect x="0" y="0" width="3" height="40" fill="#000" />
                  <rect x="5" y="0" width="2" height="40" fill="#000" />
                  <rect x="10" y="0" width="5" height="40" fill="#000" />
                  <rect x="18" y="0" width="2" height="40" fill="#000" />
                  <rect x="23" y="0" width="4" height="40" fill="#000" />
                  <rect x="30" y="0" width="3" height="40" fill="#000" />
                  <rect x="36" y="0" width="6" height="40" fill="#000" />
                  <rect x="45" y="0" width="2" height="40" fill="#000" />
                  <rect x="50" y="0" width="4" height="40" fill="#000" />
                  <rect x="57" y="0" width="3" height="40" fill="#000" />
                  <rect x="63" y="0" width="5" height="40" fill="#000" />
                  <rect x="71" y="0" width="2" height="40" fill="#000" />
                  <rect x="76" y="0" width="4" height="40" fill="#000" />
                  <rect x="83" y="0" width="6" height="40" fill="#000" />
                  <rect x="92" y="0" width="2" height="40" fill="#000" />
                  <rect x="97" y="0" width="4" height="40" fill="#000" />
                  <rect x="104" y="0" width="3" height="40" fill="#000" />
                  <rect x="110" y="0" width="5" height="40" fill="#000" />
                  <rect x="118" y="0" width="3" height="40" fill="#000" />
                  <rect x="124" y="0" width="4" height="40" fill="#000" />
                  <rect x="131" y="0" width="2" height="40" fill="#000" />
                  <rect x="136" y="0" width="5" height="40" fill="#000" />
                  <rect x="144" y="0" width="3" height="40" fill="#000" />
                  <rect x="150" y="0" width="2" height="40" fill="#000" />
                  <rect x="155" y="0" width="5" height="40" fill="#000" />
                  <rect x="163" y="0" width="3" height="40" fill="#000" />
                  <rect x="169" y="0" width="4" height="40" fill="#000" />
                  <rect x="176" y="0" width="2" height="40" fill="#000" />
                  <rect x="181" y="0" width="5" height="40" fill="#000" />
                  <rect x="189" y="0" width="3" height="40" fill="#000" />
                  <rect x="195" y="0" width="4" height="40" fill="#000" />
                </svg>
                <p className="font-mono font-bold text-xs tracking-widest mt-1">{product.sku}</p>
                <p className="text-[10px] text-gray-500 font-semibold truncate max-w-[200px]">
                  {product.productName} • ₹{product.price}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePrintLabels}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Print Sticker Sheet (A4 / 24-up)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;

