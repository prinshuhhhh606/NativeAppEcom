import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  X,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  'all',
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'OutForDelivery',
  'Delivered',
  'Cancelled',
];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [courierForm, setCourierForm] = useState({
    courierName: 'Delhivery Pan-India Express',
    trackingNumber: '',
  });

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = `/orders?page=${page}&limit=12`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(query);
      setOrders(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      toast.error('Failed to fetch order details');
    }
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      toast.success(`Order status updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      fetchOrders();
      if (isDetailOpen) handleOpenDetail(selectedOrder._id);
    } catch (err) {
      toast.error(err.message || 'Status transition rejected');
    }
  };

  const handleOpenCourierModal = (order) => {
    setSelectedOrder(order);
    setCourierForm({
      courierName: order.shippingDetails?.courierName || 'Delhivery Pan-India Express',
      trackingNumber: order.shippingDetails?.trackingNumber || `AWB${Date.now().toString().slice(-9)}`,
    });
    setIsCourierModalOpen(true);
  };

  const handleAssignCourier = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/orders/${selectedOrder._id}/courier`, courierForm);
      toast.success('Courier assigned & order dispatched');
      setIsCourierModalOpen(false);
      fetchOrders();
      if (isDetailOpen) handleOpenDetail(selectedOrder._id);
    } catch (err) {
      toast.error(err.message || 'Failed to assign courier');
    }
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`);
      setInvoiceData(res.data);
      setIsInvoiceOpen(true);
    } catch (err) {
      toast.error('Failed to generate invoice');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';
      case 'Shipped':
      case 'OutForDelivery':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400';
      case 'Processing':
      case 'Packed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Order Fulfillment Center
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time Pan-India order processing, dispatch, invoice generation and delivery tracking.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex space-x-1.5 overflow-x-auto pb-1 text-xs">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}>
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, or PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Delivery PIN</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No orders matching criteria
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-blue-600">{o.orderId}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {o.shippingAddress?.fullName || 'Customer'}
                      </p>
                      <p className="text-[10px] text-gray-400">{o.shippingAddress?.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {o.shippingAddress?.city}, {o.shippingAddress?.pinCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {o.items?.length || 0} items
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        ₹{o.pricing?.grandTotal}
                      </div>
                      <span className="text-[10px] text-gray-400">{o.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadge(
                          o.orderStatus
                        )}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(o._id)}
                          title="View Details"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(o)}
                          title="Change Status"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenCourierModal(o)}
                          title="Dispatch / Courier"
                          className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                          <Truck size={15} />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(o._id)}
                          title="Print Invoice"
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Slide-over Drawer */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto border-l border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                    Order #{selectedOrder.orderId}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* Status and Action banner */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block uppercase">
                    Status
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-1 ${getStatusBadge(
                      selectedOrder.orderStatus
                    )}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleOpenStatusModal(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs">
                    Update Status
                  </button>
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin size={15} className="text-blue-600" />
                  <span>Pan India Delivery Destination</span>
                </h4>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {selectedOrder.shippingAddress?.fullName}
                </p>
                <p className="text-gray-500">
                  {selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city},{' '}
                  {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pinCode}
                </p>
                <p className="text-gray-500 flex items-center space-x-1">
                  <Phone size={13} />
                  <span>Contact: {selectedOrder.shippingAddress?.phone}</span>
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                  Ordered Products ({selectedOrder.items?.length})
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="py-3 flex items-center space-x-3 text-xs">
                      <img
                        src={item.image || 'https://via.placeholder.com/50'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-[11px] text-gray-500">
                          Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-2 text-xs font-medium">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.pricing?.subtotal}</span>
                </div>
                {selectedOrder.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Coupon</span>
                    <span>-₹{selectedOrder.pricing?.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Shipping Fee</span>
                  <span>{selectedOrder.pricing?.shipping === 0 ? 'FREE' : `₹${selectedOrder.pricing?.shipping}`}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>GST (18% included)</span>
                  <span>₹{selectedOrder.pricing?.gst}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.pricing?.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex space-x-3">
              <button
                onClick={() => handleViewInvoice(selectedOrder._id)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 flex items-center justify-center space-x-2">
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-slate-800 text-white text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
              Update Order #{selectedOrder.orderId}
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  {STATUS_TABS.filter((s) => s !== 'all').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Audit / Customer Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched via morning delivery van"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none text-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier & AWB Assignment Modal */}
      {isCourierModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
              Dispatch & Courier Assignment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Assign courier partner and tracking AWB number for order #{selectedOrder.orderId}.
            </p>

            <form onSubmit={handleAssignCourier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Courier Partner *
                </label>
                <select
                  value={courierForm.courierName}
                  onChange={(e) => setCourierForm({ ...courierForm, courierName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="Delhivery Pan-India Express">Delhivery Pan-India Express</option>
                  <option value="BlueDart Priority">BlueDart Priority Air</option>
                  <option value="Ekart Logistics">Ekart Logistics</option>
                  <option value="DTDC Surface & Air">DTDC Surface & Air</option>
                  <option value="India Post SpeedPost">India Post SpeedPost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  AWB / Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  value={courierForm.trackingNumber}
                  onChange={(e) => setCourierForm({ ...courierForm, trackingNumber: e.target.value })}
                  placeholder="AWB123456789"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm">
                  Mark Shipped & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {isInvoiceOpen && invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-200 relative">
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 print:hidden">
              <X size={20} />
            </button>

            <div id="printable-invoice" className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-blue-600 tracking-tight">
                    {invoiceData.store?.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    GSTIN: <span className="font-mono font-bold">{invoiceData.store?.gstin}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {invoiceData.store?.address?.addressLine}, {invoiceData.store?.address?.city}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black uppercase text-gray-800">Tax Invoice</h3>
                  <p className="text-xs font-mono font-bold text-blue-600 mt-1">
                    {invoiceData.invoiceNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    Date: {new Date(invoiceData.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="bg-gray-50 p-4 rounded-xl text-xs">
                <span className="font-bold text-gray-400 uppercase text-[10px] block mb-1">
                  Billed & Delivered To:
                </span>
                <p className="font-bold text-gray-900">{invoiceData.customer?.name}</p>
                <p className="text-gray-600">{invoiceData.customer?.address}</p>
                <p className="text-gray-600 font-mono mt-0.5">Contact: {invoiceData.customer?.phone}</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {invoiceData.items?.map((it) => (
                    <tr key={it.srNo}>
                      <td className="py-2.5 px-3">{it.srNo}</td>
                      <td className="py-2.5 px-3 font-semibold">
                        {it.name} <span className="text-gray-500">({it.variant})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{it.unitPrice}</td>
                      <td className="py-2.5 px-3 text-right font-bold">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">₹{invoiceData.pricing?.subtotal}</span>
                  </div>
                  {invoiceData.pricing?.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-₹{invoiceData.pricing?.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Charges:</span>
                    <span>₹{invoiceData.pricing?.shipping}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9%):</span>
                    <span>₹{invoiceData.pricing?.cgst}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9%):</span>
                    <span>₹{invoiceData.pricing?.sgst}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-black text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span>₹{invoiceData.pricing?.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Terms footer */}
              <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-400 text-center">
                This is a computer-generated tax invoice. Registered under GST laws of India.
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm">
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

