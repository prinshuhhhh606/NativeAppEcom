import React, { useState, useEffect, useCallback } from 'react';
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
  Download,
  Bike,
  RefreshCw,
  RotateCcw,
  Package,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Exactly 15 Status Tabs matching the Master Prompt
const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'new', label: 'New' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready_for_pickup', label: 'Ready for Pickup' },
  { id: 'delivery_requested', label: 'Delivery Requested' },
  { id: 'delivery_partner_assigned', label: 'Rider Assigned' },
  { id: 'picked_up', label: 'Picked Up' },
  { id: 'shipped', label: 'Shipped / In Transit' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'refund_requested', label: 'Refund Requested' },
  { id: 'refunded', label: 'Refunded' },
];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Delivery partner list for manual assignment
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assignMode, setAssignMode] = useState('rider'); // 'rider' or '3pl'

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [courierForm, setCourierForm] = useState({
    courierName: 'Delhivery Pan-India Express',
    trackingNumber: '',
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/orders?page=${page}&limit=15`;
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
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch active delivery partners for assignment
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await api.get('/delivery-partners');
        if (res.data) setDeliveryPartners(res.data);
      } catch (err) {
        // non-blocking
      }
    };
    fetchPartners();
  }, []);

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
    setSelectedRiderId('');
    setAssignMode('rider');
    setCourierForm({
      courierName: order.shippingDetails?.courierName || 'Delhivery Pan-India Express',
      trackingNumber: order.shippingDetails?.trackingNumber || `AWB${Date.now().toString().slice(-9)}`,
    });
    setIsCourierModalOpen(true);
  };

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    try {
      if (assignMode === 'rider') {
        if (!selectedRiderId) {
          toast.error('Please choose a delivery rider from fleet');
          return;
        }
        await api.post('/delivery-partners/assign-order', {
          orderId: selectedOrder._id,
          partnerId: selectedRiderId,
        });
        toast.success('Rider assigned & pickup notification broadcasted');
      } else {
        await api.patch(`/orders/${selectedOrder._id}/courier`, courierForm);
        toast.success('3PL Courier assigned & order dispatched');
      }
      setIsCourierModalOpen(false);
      fetchOrders();
      if (isDetailOpen) handleOpenDetail(selectedOrder._id);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch order');
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

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('appecom_admin_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';
      const response = await fetch(`${baseUrl}/orders/export/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to export orders CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Orders data exported to CSV');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered') || s === 'completed')
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
    if (s.includes('cancel') || s.includes('reject'))
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200';
    if (s.includes('ship') || s.includes('transit') || s.includes('out_for_delivery') || s.includes('picked'))
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200';
    if (s.includes('prepar') || s.includes('pack') || s.includes('confirm') || s.includes('ready'))
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Order Fulfillment Hub
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Complete multi-vendor order pipeline with live dispatch and rider assignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => fetchOrders()}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 15 Status Tabs Horizontal Scroll Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, destination phone or PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-medium text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="py-4 px-6">Order ID & Date</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Items</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No orders found matching tab criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{o.orderId || o.orderNumber || o._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {o.shippingAddress?.fullName || o.deliveryAddress?.fullName || 'Customer'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {o.shippingAddress?.phone || o.deliveryAddress?.phone || 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        {o.shippingAddress?.city || o.deliveryAddress?.city},{' '}
                        {o.shippingAddress?.pinCode || o.deliveryAddress?.pinCode}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                      {o.items?.length || 0} items
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-gray-900 dark:text-white">
                        ₹{Number(o.totalAmount || o.pricing?.grandTotal || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {o.paymentMethod || 'Online'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(
                          o.orderStatus || o.status
                        )}`}>
                        {o.orderStatus || o.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(o._id)}
                          title="View Details"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(o)}
                          title="Change Status"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenCourierModal(o)}
                          title="Assign Courier / Rider"
                          className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                          <Truck size={16} />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(o._id)}
                          title="Print Invoice"
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                          <Printer size={16} />
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
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Drawer */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto border-l border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    Order #{selectedOrder.orderId || selectedOrder._id?.slice(-8)}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Fulfillment Status</span>
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-xs font-black mt-1 ${getStatusBadge(
                      selectedOrder.orderStatus
                    )}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenStatusModal(selectedOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition">
                  Change Status
                </button>
              </div>

              {/* Destination Address */}
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-1.5 text-xs">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin size={15} className="text-indigo-600" />
                  <span>Pan India Delivery Destination</span>
                </h4>
                <p className="font-bold text-gray-800 dark:text-gray-200">
                  {selectedOrder.shippingAddress?.fullName}
                </p>
                <p className="text-gray-500">
                  {selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city},{' '}
                  {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pinCode}
                </p>
                <p className="text-gray-500 font-mono">Phone: {selectedOrder.shippingAddress?.phone}</p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                  Items ({selectedOrder.items?.length || 0})
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
                      <div className="font-black text-sm text-gray-900 dark:text-white">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-2 text-xs font-medium">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.pricing?.subtotal || selectedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping Fee</span>
                  <span>{selectedOrder.pricing?.shipping === 0 ? 'FREE' : `₹${selectedOrder.pricing?.shipping || 0}`}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.totalAmount || selectedOrder.pricing?.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex space-x-3">
              <button
                onClick={() => handleViewInvoice(selectedOrder._id)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 flex items-center justify-center space-x-2">
                <Printer size={15} />
                <span>View Tax Invoice</span>
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-slate-800 text-white text-xs font-bold">
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="font-black text-base text-gray-900 dark:text-white mb-1">
              Update Order #{selectedOrder.orderId || selectedOrder._id?.slice(-8)}
            </h3>
            <p className="text-xs text-gray-400 mb-4">Select target fulfillment milestone in lifecycle</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Delivery Partner Assigned">Delivery Partner Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="Shipped">Shipped / In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {newStatus === 'Delivered' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Note: Customer delivery verification normally requires the 4-digit OTP provided upon delivery.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Audit Log / Operational Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched via express hub van"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-white outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier & Rider Assignment Modal */}
      {isCourierModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="font-black text-base text-gray-900 dark:text-white mb-1">
              Dispatch & Delivery Assignment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Assign order #{selectedOrder.orderId} to an internal delivery boy or external 3PL courier
            </p>

            {/* Toggle Mode */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAssignMode('rider')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                  assignMode === 'rider'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500'
                }`}>
                <Bike className="w-4 h-4" />
                <span>Delivery Fleet Rider</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('3pl')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                  assignMode === '3pl'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500'
                }`}>
                <Truck className="w-4 h-4" />
                <span>3PL Courier Partner</span>
              </button>
            </div>

            <form onSubmit={handleDispatchOrder} className="space-y-4">
              {assignMode === 'rider' ? (
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Select Active Delivery Boy *
                  </label>
                  <select
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none"
                    required>
                    <option value="">-- Select Rider from Fleet --</option>
                    {deliveryPartners.map((dp) => (
                      <option key={dp._id} value={dp._id}>
                        {dp.name} ({dp.phone}) - {dp.isOnline ? '🟢 Online' : '⚪ Offline'} [{dp.vehicleType || 'Bike'}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                      Courier Partner *
                    </label>
                    <select
                      value={courierForm.courierName}
                      onChange={(e) => setCourierForm({ ...courierForm, courierName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                      <option value="Delhivery Pan-India Express">Delhivery Pan-India Express</option>
                      <option value="BlueDart Priority Air">BlueDart Priority Air</option>
                      <option value="Ekart Logistics">Ekart Logistics</option>
                      <option value="DTDC Surface & Air">DTDC Surface & Air</option>
                      <option value="India Post SpeedPost">India Post SpeedPost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                      AWB / Tracking Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={courierForm.trackingNumber}
                      onChange={(e) => setCourierForm({ ...courierForm, trackingNumber: e.target.value })}
                      placeholder="AWB123456789"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-gray-800 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {isInvoiceOpen && invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white text-gray-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-gray-200 relative">
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 print:hidden">
              <X size={20} />
            </button>

            <div id="printable-invoice" className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-indigo-600 tracking-tight">
                    {invoiceData.store?.name || 'Bharat Bazaar'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    GSTIN: <span className="font-mono font-bold">{invoiceData.store?.gstin || '27AAAAA0000A1Z5'}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {invoiceData.store?.address?.addressLine || 'Central Logistics Hub, Sector 18'},{' '}
                    {invoiceData.store?.address?.city || 'Mumbai'}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black uppercase text-gray-800">Tax Invoice</h3>
                  <p className="text-xs font-mono font-bold text-indigo-600 mt-1">
                    {invoiceData.invoiceNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    Date: {new Date(invoiceData.date || Date.now()).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="bg-gray-50 p-4 rounded-2xl text-xs">
                <span className="font-bold text-gray-400 uppercase text-[10px] block mb-1">
                  Billed & Delivered To:
                </span>
                <p className="font-bold text-gray-900">{invoiceData.customer?.name}</p>
                <p className="text-gray-600">{invoiceData.customer?.address}</p>
                <p className="text-gray-600 font-mono mt-0.5">Contact: {invoiceData.customer?.phone}</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
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
                  {invoiceData.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold">
                        {it.name} <span className="text-gray-500">{it.variant ? `(${it.variant})` : ''}</span>
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

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-400 text-center">
                This is an official computer-generated tax invoice for marketplace goods.
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md">
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
