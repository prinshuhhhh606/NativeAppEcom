import React from 'react';
import { Printer, X, Download, Truck, Package, ShieldCheck } from 'lucide-react';

export const ShippingLabelModal = ({ isOpen, onClose, order, labelData }) => {
  if (!isOpen || !order) return null;

  const awb = labelData?.awbNumber || order.shipping?.awbNumber || 'AWB' + Math.floor(1000000000 + Math.random() * 9000000000);
  const trackingNumber = labelData?.trackingNumber || order.shipping?.trackingNumber || 'BBIN-TRK-' + Math.floor(10000000 + Math.random() * 90000000);
  const courier = labelData?.courierName || order.shipping?.courierName || 'Delhivery';
  const weight = labelData?.weight || order.shipping?.weight || 0.5;
  const dimensions = labelData?.dimensions || order.shipping?.dimensions || { length: 15, width: 10, height: 5 };
  const customer = order.customerName || order.shippingAddress?.fullName || 'Customer';
  const phone = order.customerPhone || order.shippingAddress?.mobileNumber || '';
  const address = order.shippingAddress || {};
  const isCod = (order.paymentMethod || '').toUpperCase().includes('COD');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 relative print:border-none print:shadow-none print:max-w-full print:p-0">
        {/* Controls - Hidden on print */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Logistics Shipping Label
              </h3>
              <p className="text-xs text-gray-400">Standard 4x6" thermal & A4 courier dispatch slip</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label Container */}
        <div className="border-2 border-black p-4 text-black bg-white rounded-lg font-sans text-xs">
          {/* Top Bar: Courier & Mode */}
          <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
            <div>
              <span className="text-xl font-black tracking-tighter uppercase">{courier}</span>
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 border border-black uppercase">
                Air Express
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-black px-2 py-0.5 uppercase border-2 ${
                  isCod ? 'border-black bg-black text-white' : 'border-black'
                }`}
              >
                {isCod ? `COD ₹${order.subtotal || order.totalAmount}` : 'PREPAID'}
              </span>
            </div>
          </div>

          {/* Barcode & AWB */}
          <div className="text-center py-2 border-b-2 border-black my-2">
            {/* Visual Barcode Bars */}
            <div className="h-12 flex justify-center items-end gap-[2px] mx-auto overflow-hidden">
              {[40, 20, 60, 80, 50, 90, 70, 30, 85, 45, 65, 95, 35, 75, 55, 80, 40, 60, 90, 30, 70, 85, 45, 65, 95, 50, 75, 40, 85, 30, 90, 60, 45, 80, 55, 70, 40, 95, 65, 50].map(
                (h, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${h}%`, width: idx % 3 === 0 ? '3px' : '1.5px' }}
                    className="bg-black"
                  />
                )
              )}
            </div>
            <p className="font-mono font-extrabold text-sm tracking-widest mt-1">
              AWB: {awb}
            </p>
            <p className="font-mono text-[10px] text-gray-600">
              TRK: {trackingNumber}
            </p>
          </div>

          {/* Destination Routing Box */}
          <div className="grid grid-cols-3 border-b-2 border-black pb-2 mb-2">
            <div className="col-span-2 pr-2">
              <p className="text-[10px] uppercase font-bold text-gray-500">Deliver To:</p>
              <p className="text-sm font-extrabold">{customer}</p>
              <p className="text-xs leading-tight mt-0.5">
                {address.addressLine1 || address.streetAddress || 'Address Line 1'}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </p>
              <p className="text-xs font-bold mt-0.5">
                {address.city || 'City'}, {address.state || 'State'}
              </p>
              <p className="text-sm font-black tracking-wider mt-1">
                PIN: {address.pinCode || address.pincode || '302001'}
              </p>
              <p className="text-xs font-semibold mt-0.5">Mob: {phone || 'N/A'}</p>
            </div>

            <div className="border-l-2 border-black pl-2 flex flex-col justify-between text-right">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">Destination PIN</p>
                <p className="text-2xl font-black tracking-tight">
                  {address.pinCode || address.pincode || '302001'}
                </p>
              </div>
              <div className="text-[10px]">
                <p className="font-bold">Sub-Order #</p>
                <p className="font-mono font-semibold">{order.subOrderNumber}</p>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="grid grid-cols-3 text-[10px] border-b-2 border-black pb-2 mb-2">
            <div>
              <span className="text-gray-500">Weight:</span>{' '}
              <span className="font-bold">{weight} kg</span>
            </div>
            <div>
              <span className="text-gray-500">Dimensions:</span>{' '}
              <span className="font-bold">
                {dimensions.length}x{dimensions.width}x{dimensions.height} cm
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Items:</span>{' '}
              <span className="font-bold">{order.itemCount || order.items?.length || 1} units</span>
            </div>
          </div>

          {/* Return / Shipper Address */}
          <div className="text-[10px] pt-1">
            <p className="font-bold uppercase text-gray-500">Shipped From (Return Address):</p>
            <p className="font-extrabold text-xs">
              {labelData?.seller?.storeName || 'Bharat Bazaar Verified Merchant'}
            </p>
            <p className="text-gray-700">
              Logistics Fulfillment Center, Jaipur Handlooms & Crafts Hub, Rajasthan - 302001
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-3 pt-1 border-t border-dashed border-gray-400 flex justify-between items-center text-[9px] text-gray-500">
            <span>Marketplace: Bharat Bazaar</span>
            <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
            <span>Verified Secure Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;

