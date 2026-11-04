import React from 'react';
import { Printer, X, Download, PackageCheck } from 'lucide-react';
import Modal from '../common/Modal';

export const BulkInvoiceModal = ({ isOpen, onClose, invoiceSlips = [] }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Print Bulk Invoices & Packing Slips (${invoiceSlips.length} Orders)`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Print Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Print-ready standardized Bharat Bazaar GST Tax Invoices and Dispatch Slips.
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Slips (Ctrl+P)</span>
          </button>
        </div>

        {/* Invoices List */}
        <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2">
          {invoiceSlips.map((slip, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white space-y-4 page-break shadow-sm"
            >
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b pb-4 border-gray-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-emerald-600">
                    BHARAT BAZAAR LOGISTICS TAX INVOICE
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Invoice #{slip.invoiceNumber} • Date: {new Date(slip.invoiceDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-gray-900 dark:text-white block">
                    Sub-Order: {slip.subOrderNumber}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Tracking: {slip.trackingNumber}
                  </span>
                </div>
              </div>

              {/* Seller & Customer Addresses */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Sold By (Merchant)
                  </span>
                  <p className="font-bold text-sm">{slip.seller?.storeName}</p>
                  <p className="text-gray-500">{slip.seller?.pickupAddress?.street || 'Connaught Place'}</p>
                  <p className="text-gray-500">
                    {slip.seller?.pickupAddress?.city || 'Jaipur'}, {slip.seller?.pickupAddress?.state || 'Rajasthan'} - {slip.seller?.pickupAddress?.pinCode || '302001'}
                  </p>
                  <p className="font-mono text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    GSTIN: {slip.seller?.gstin}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Shipping & Delivery To (Buyer)
                  </span>
                  <p className="font-bold text-sm">{slip.customer?.name}</p>
                  <p className="text-gray-500">{slip.customer?.shippingAddress?.addressLine1 || slip.customer?.shippingAddress?.street || 'Delivery Address'}</p>
                  <p className="text-gray-500">
                    {slip.customer?.shippingAddress?.city || 'New Delhi'}, {slip.customer?.shippingAddress?.state || 'Delhi'} - {slip.customer?.shippingAddress?.pinCode || '110001'}
                  </p>
                  <p className="text-gray-500">Carrier: {slip.courierName}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-xl border-gray-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {(slip.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{item.name || item.productName || 'Handcrafted Product'}</td>
                        <td className="py-2 px-3">{item.quantity || 1}</td>
                        <td className="py-2 px-3 text-right">₹{item.price?.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center text-xs pt-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400">
                    * Computer generated invoice. Signature not required.
                  </p>
                  <p className="font-mono text-[10px] text-gray-400">
                    Routing Code: DL-HUB-{Math.floor(100 + Math.random() * 900)} • 100% Verified
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block font-semibold">Total Amount</span>
                  <span className="text-base font-black text-gray-900 dark:text-white">
                    ₹{slip.subtotal?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default BulkInvoiceModal;

