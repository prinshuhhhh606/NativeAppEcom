import React from 'react';
import { Printer, X, Download, FileText, CheckCircle2 } from 'lucide-react';

export const OrderInvoiceModal = ({ isOpen, onClose, order, seller }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.subOrderNumber || order.orderNumber || order._id?.slice(-8)}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const subtotal = order.subtotal || order.totalAmount || 0;
  const gstRate = 18;
  const taxableValue = Math.round((subtotal * 100) / (100 + gstRate));
  const totalTax = subtotal - taxableValue;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  const customer = order.customerName || order.shippingAddress?.fullName || 'Customer';
  const phone = order.customerPhone || order.shippingAddress?.mobileNumber || '';
  const email = order.customerEmail || 'customer@appecom.in';
  const address = order.shippingAddress || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 relative print:border-none print:shadow-none print:max-w-full print:p-0">
        {/* Controls - Hidden on print */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Tax Invoice / Bill of Supply
              </h3>
              <p className="text-xs text-gray-400">Formal GST complaint invoice for customer records</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="border border-gray-300 p-6 text-black bg-white rounded-lg font-sans text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">TAX INVOICE</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Original for Recipient</p>
              <p className="font-mono font-bold text-xs mt-2">Invoice #: {invoiceNumber}</p>
              <p className="text-[11px] text-gray-600">Invoice Date: {invoiceDate}</p>
              <p className="font-mono text-[11px] text-gray-600">Order Ref: {order.orderNumber || order.subOrderNumber}</p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-extrabold tracking-tight text-emerald-800">BHARAT BAZAAR</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Online Marketplace Facilitator</p>
              <p className="text-xs font-bold mt-1">{seller?.storeName || seller?.businessName || 'Verified Merchant Store'}</p>
              <p className="text-[11px] text-gray-600">GSTIN: {seller?.gstin || '08AABCU9603R1ZM'}</p>
              <p className="text-[11px] text-gray-600">PAN: {seller?.panNumber || 'AABCU9603R'}</p>
              <p className="text-[11px] text-gray-500">State: Rajasthan (Code: 08)</p>
            </div>
          </div>

          {/* Sold By & Bill To */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-300 pb-4 mb-4">
            <div>
              <p className="font-bold uppercase text-[10px] text-gray-500">Sold & Dispatched By:</p>
              <p className="font-extrabold text-xs">{seller?.storeName || seller?.businessName || 'Vendor Handlooms'}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">
                {seller?.address?.street || 'Crafts Hub, Tonk Road, Sanganer'}
              </p>
              <p className="text-[11px] text-gray-700">
                {seller?.address?.city || 'Jaipur'}, {seller?.address?.state || 'Rajasthan'} - {seller?.address?.pincode || '302029'}
              </p>
              <p className="text-[11px] text-gray-700">Phone: {seller?.phone || '9876543210'}</p>
            </div>

            <div>
              <p className="font-bold uppercase text-[10px] text-gray-500">Billing & Shipping Address:</p>
              <p className="font-extrabold text-xs">{customer}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">
                {address.addressLine1 || address.streetAddress || 'Address details'}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </p>
              <p className="text-[11px] text-gray-700">
                {address.city || 'City'}, {address.state || 'State'} - {address.pinCode || address.pincode || '302001'}
              </p>
              <p className="text-[11px] text-gray-700">Mobile: {phone || 'N/A'}</p>
              <p className="text-[11px] text-gray-700">Email: {email}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Taxable Amt</th>
                  <th className="py-2 px-3 text-right">GST</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(order.items || []).map((item, idx) => {
                  const itPrice = item.price || 0;
                  const itQty = item.quantity || 1;
                  const itTotal = itPrice * itQty;
                  const itTaxable = Math.round((itTotal * 100) / (100 + gstRate));
                  const itGst = itTotal - itTaxable;

                  return (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <p className="font-bold text-gray-900">{item.name || item.product?.productName || item.product?.name || 'Product'}</p>
                        {item.selectedVariant?.size && (
                          <span className="text-[10px] text-gray-500">
                            Size: {item.selectedVariant.size} | Color: {item.selectedVariant.color || 'Standard'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-gray-600">{item.sku || 'SKU-IN'}</td>
                      <td className="py-2 px-3 text-center font-bold">{itQty}</td>
                      <td className="py-2 px-3 text-right">₹{itPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right">₹{itTaxable.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right">₹{itGst.toLocaleString('en-IN')} (18%)</td>
                      <td className="py-2 px-3 text-right font-extrabold text-gray-900">₹{itTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown */}
          <div className="flex justify-end mb-4">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount:</span>
                <span className="font-semibold">₹{taxableValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9.0%):</span>
                <span className="font-semibold">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9.0%):</span>
                <span className="font-semibold">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping / Delivery:</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-800 text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-gray-500 text-right pt-0.5">
                Payment Mode: <strong className="text-gray-900 uppercase">{order.paymentMethod || 'Online'}</strong> ({order.paymentStatus || 'Completed'})
              </div>
            </div>
          </div>

          {/* Footer Declaration & Signature */}
          <div className="grid grid-cols-2 border-t border-gray-300 pt-3 text-[10px] text-gray-600">
            <div>
              <p className="font-bold uppercase text-gray-700">Declaration:</p>
              <p className="text-[9px] leading-tight text-gray-500 mt-0.5">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold are covered under marketplace buyer protection guarantee.
              </p>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              <div className="h-8 flex items-center justify-center font-mono text-[10px] text-gray-400 italic">
                [Digitally Signed By Verified Seller]
              </div>
              <p className="font-bold text-gray-800">Authorized Signatory</p>
              <p className="text-[9px] text-gray-500">{seller?.storeName || 'Bharat Bazaar Merchant'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceModal;

