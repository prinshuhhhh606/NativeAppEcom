import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  PackageCheck,
  AlertCircle,
  Bike,
  UserCheck,
  Star,
  MapPin,
  PhoneCall,
  XCircle,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Traditional Courier Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Delivery Partner Fleet Assignment State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [eligiblePartners, setEligiblePartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [assignmentInfo, setAssignmentInfo] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      const res = await sellerService.getOrders(params);
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // When an order is opened in details modal, also fetch its delivery assignment status
  useEffect(() => {
    if (selectedOrder) {
      loadOrderAssignment(selectedOrder.orderNumber || selectedOrder._id);
    } else {
      setAssignmentInfo(null);
    }
  }, [selectedOrder]);

  const loadOrderAssignment = async (orderId) => {
    try {
      const res = await sellerService.getOrderDeliveryAssignment(orderId);
      if (res.data?.assignment) {
        setAssignmentInfo(res.data.assignment);
      } else {
        setAssignmentInfo(null);
      }
    } catch (e) {
      setAssignmentInfo(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId.slice(-6)} status updated to ${newStatus}!`);
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        const updated = await sellerService.getOrderById(orderId);
        setSelectedOrder(updated.data.order || null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber) {
      toast.error('Please enter Courier AWB Tracking Number');
      return;
    }

    setUpdating(true);
    try {
      await sellerService.updateTracking(selectedOrder._id, {
        courierPartner,
        trackingNumber,
      });
      await sellerService.updateOrderStatus(selectedOrder._id, 'shipped');
      toast.success('Shipment tracking saved and order marked as In Transit!');
      setTrackingModalOpen(false);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch shipment');
    } finally {
      setUpdating(false);
    }
  };

  // Open Assign Delivery Partner Modal
  const openAssignModal = async () => {
    setLoadingPartners(true);
    setAssignModalOpen(true);
    try {
      const res = await sellerService.getEligibleDeliveryPartners({
        city: selectedOrder.shippingAddress?.city,
        pinCode: selectedOrder.shippingAddress?.pinCode,
      });
      const partnersList = res.data?.partners || [];
      setEligiblePartners(partnersList);
      if (partnersList.length > 0) {
        setSelectedPartnerId(partnersList[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load online delivery partners');
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleAssignDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      toast.error('Please select an approved delivery partner');
      return;
    }

    setUpdating(true);
    try {
      const res = await sellerService.assignDeliveryPartner({
        orderId: selectedOrder.orderNumber || selectedOrder._id,
        deliveryPartnerId: selectedPartnerId,
        specialInstructions,
      });

      toast.success(res.message || 'Delivery request sent to rider!');
      setAssignModalOpen(false);
      loadOrderAssignment(selectedOrder.orderNumber || selectedOrder._id);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign delivery');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelAssignment = async () => {
    if (!assignmentInfo) return;
    if (!window.confirm('Are you sure you want to cancel this delivery assignment?')) return;

    setUpdating(true);
    try {
      await sellerService.cancelDeliveryAssignment(assignmentInfo._id || assignmentInfo.assignmentId);
      toast.success('Assignment cancelled. You can now assign another rider.');
      loadOrderAssignment(selectedOrder.orderNumber || selectedOrder._id);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel assignment');
    } finally {
      setUpdating(false);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'new', label: 'New Received' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'packed', label: 'Packed' },
    { id: 'shipped', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Order Fulfillment & Dispatch
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage incoming orders, generate invoices, assign local delivery riders, and dispatch shipments.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 border border-gray-100 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700/80 bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 dark:text-gray-500 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-4 px-5">Order #</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Items</th>
                <th className="py-4 px-4">Net Payout</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading vendor orders...</span>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const status = order.fulfillmentStatus || order.status || 'new';
                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {order.subOrderNumber || order.orderNumber || order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                          {order.shippingAddress?.fullName || order.customerName || 'Customer'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {order.shippingAddress?.city || 'India'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-600 dark:text-gray-300">
                        {order.items?.length || 1} items
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-black text-gray-900 dark:text-white">
                            ₹{(order.netEarnings || order.subtotal || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] block text-emerald-600 font-semibold">
                            (Receivable)
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={status} size="sm" />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-gray-800 dark:text-gray-200 transition-colors"
                        >
                          Manage Order
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No orders in this category</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Fulfillment Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Management — ${selectedOrder.subOrderNumber || selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Status Progress Bar */}
            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500">Current Fulfillment State</span>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.fulfillmentStatus || selectedOrder.status} size="lg" />
                </div>
              </div>

              {/* Action Buttons depending on status */}
              <div className="flex items-center gap-2">
                {(selectedOrder.fulfillmentStatus === 'new' || selectedOrder.status === 'new') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'accepted')}
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Accept Order
                  </button>
                )}

                {selectedOrder.fulfillmentStatus === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'packed')}
                    disabled={updating}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Mark as Packed
                  </button>
                )}

                {/* Assign Delivery Partner Button */}
                <button
                  onClick={openAssignModal}
                  disabled={updating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Bike className="w-4 h-4" />
                  <span>Assign Fleet Rider</span>
                </button>

                {selectedOrder.fulfillmentStatus === 'packed' && (
                  <button
                    onClick={() => setTrackingModalOpen(true)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Courier AWB</span>
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="p-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-300"
                  title="Print Shipping Label / Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delivery Partner Assignment Card */}
            {assignmentInfo && (
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-100 dark:bg-teal-900/60 rounded-xl text-teal-700 dark:text-teal-300">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-teal-950 dark:text-teal-100 text-sm">
                        Rider: {assignmentInfo.deliveryPartnerName || assignmentInfo.deliveryPartner?.name || 'Assigned Partner'}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-200/80 text-teal-900 dark:bg-teal-800 dark:text-teal-200">
                        {assignmentInfo.status}
                      </span>
                    </div>
                    <p className="text-teal-700 dark:text-teal-300 mt-0.5">
                      Task ID: <span className="font-mono font-bold">{assignmentInfo.assignmentId}</span> • Fee: ₹{assignmentInfo.deliveryFee || 65}
                    </p>
                    {assignmentInfo.deliveryPartner?.phone && (
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        <span>+91 {assignmentInfo.deliveryPartner.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {assignmentInfo.status === 'requested' && (
                    <button
                      onClick={handleCancelAssignment}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                    >
                      Cancel Assignment
                    </button>
                  )}
                  <button
                    onClick={openAssignModal}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                  >
                    Reassign Rider
                  </button>
                </div>
              </div>
            )}

            {/* Courier Tracking Info if dispatched */}
            {selectedOrder.trackingNumber && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-200">
                      Courier: {selectedOrder.courierPartner || 'Standard Express'}
                    </p>
                    <p className="font-mono text-blue-700 dark:text-blue-300 mt-0.5">
                      AWB / Tracking Number: {selectedOrder.trackingNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Shipping Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Delivery Destination
                </h4>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.street}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                  {selectedOrder.shippingAddress?.pinCode}
                </p>
                <p className="text-gray-500 mt-1">
                  Mobile: {selectedOrder.shippingAddress?.mobileNumber || selectedOrder.customerPhone || 'N/A'}
                </p>
              </div>

              {/* Settlement Summary */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Payout Breakdown
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Subtotal:</span>
                    <span className="font-semibold">₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Marketplace Commission ({selectedOrder.commissionRate || 10}%):</span>
                    <span>- ₹{(selectedOrder.commissionAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-gray-100 dark:border-slate-700 text-sm">
                    <span>Net Vendor Receivable:</span>
                    <span>₹{(selectedOrder.netEarnings || selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-3">
                Items to Fulfill
              </h4>
              <div className="border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 text-gray-400">
                    <tr>
                      <th className="py-2.5 px-4">Item</th>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700 font-medium">
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <span className="font-bold text-gray-900 dark:text-white line-clamp-1">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {item.selectedVariant?.color || item.selectedVariant?.size || 'Standard'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">{item.quantity}</td>
                        <td className="py-3 px-3">₹{item.price?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Select & Assign Delivery Partner Modal */}
      {assignModalOpen && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title="Select & Assign Delivery Partner"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAssignDeliverySubmit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select an approved, online delivery partner near your store. The rider will receive an instant notification with pickup details.
            </p>

            {loadingPartners ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <span>Checking available nearby riders...</span>
              </div>
            ) : eligiblePartners.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {eligiblePartners.map((p) => (
                  <label
                    key={p._id}
                    className={`block p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedPartnerId === p._id
                        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="deliveryPartner"
                          value={p._id}
                          checked={selectedPartnerId === p._id}
                          onChange={() => setSelectedPartnerId(p._id)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <p className="font-extrabold text-xs text-gray-900 dark:text-white">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {p.vehicleType} ({p.vehicleNumber}) • {p.approxDistanceKm} km away
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-xs font-black text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{p.rating}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          Online & Available
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl text-center text-xs text-gray-500">
                No active riders currently available in this delivery zone.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Fragile package, handle with care."
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || eligiblePartners.length === 0}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {updating ? 'Assigning...' : 'Assign & Notify Rider'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Traditional Courier Dispatch Dialog */}
      {trackingModalOpen && (
        <Modal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          title="Courier Dispatch & Tracking"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleDispatchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Courier Logistic Partner *
              </label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="Delhivery">Delhivery Surface / Express</option>
                <option value="BlueDart">BlueDart Express</option>
                <option value="Shiprocket">Shiprocket Automated</option>
                <option value="Shadowfax">Shadowfax Quick Delivery</option>
                <option value="India Post">India Post Speed Post</option>
                <option value="DTDC">DTDC Courier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                AWB Tracking Number *
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DLHV892348123"
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {updating ? 'Assigning...' : 'Confirm Dispatch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
