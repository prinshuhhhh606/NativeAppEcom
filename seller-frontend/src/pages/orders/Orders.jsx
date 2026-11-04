import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Mail,
  XCircle,
  MessageSquare,
  FileText,
  Boxes,
  CheckSquare,
  Square,
  Send,
  Calendar,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Tag,
  ShieldCheck,
  Compass,
  Layers,
  Copy,
  Info,
  LayoutGrid,
  List,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import OrderCommunicationModal from '../../components/orders/OrderCommunicationModal';
import BulkInvoiceModal from '../../components/orders/BulkInvoiceModal';
import ShippingLabelModal from '../../components/orders/ShippingLabelModal';
import OrderInvoiceModal from '../../components/orders/OrderInvoiceModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Orders = ({ initialMode = 'orders' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller } = useAuth();

  // Mode: 'orders' (Order Management) vs 'shipping' (Shipping Management)
  const isShippingRoute = location.pathname.includes('/shipping') || initialMode === 'shipping';
  const [activeModule, setActiveModule] = useState(isShippingRoute ? 'shipping' : 'orders');

  useEffect(() => {
    if (location.pathname.includes('/shipping')) {
      setActiveModule('shipping');
    }
  }, [location.pathname]);

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Status Tab selection
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Statistics counters
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    newOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    readyToShipOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
  });

  // Selected Order for Details View
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Printable Invoice & Shipping Label State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelOrder, setLabelOrder] = useState(null);
  const [generatedLabelData, setGeneratedLabelData] = useState(null);

  // Tracking History Timeline Modal State
  const [trackingTimelineModalOpen, setTrackingTimelineModalOpen] = useState(false);
  const [trackingTimelineOrder, setTrackingTimelineOrder] = useState(null);

  // Shipping Configuration Modal (Courier & Dimensions)
  const [shippingConfigModalOpen, setShippingConfigModalOpen] = useState(false);
  const [shippingConfigOrder, setShippingConfigOrder] = useState(null);
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [packageWeight, setPackageWeight] = useState(0.5);
  const [dimensions, setDimensions] = useState({ length: 15, width: 10, height: 5 });
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('Morning (10:00 AM - 01:00 PM)');

  // Rejection & Cancellation State with Mandatory Reason
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectAction, setRejectAction] = useState('rejected');
  const [rejectOrderId, setRejectOrderId] = useState('');
  const [rejectReasonPreset, setRejectReasonPreset] = useState('Out of stock');
  const [rejectCustomReason, setRejectCustomReason] = useState('');

  // Bulk Operations State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkInvoiceModalOpen, setBulkInvoiceModalOpen] = useState(false);
  const [bulkInvoices, setBulkInvoices] = useState([]);

  // Customer Messaging Modal State
  const [communicationOrder, setCommunicationOrder] = useState(null);

  // 1. Fetch Orders from Backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
      };
      if (selectedStatus && selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const res = await sellerService.getOrders(params);
      const orderList = res.data?.orders || (Array.isArray(res.data) ? res.data : []);
      const count = res.data?.totalCount || res.pagination?.totalCount || orderList.length;

      setOrders(orderList);
      setTotalCount(count);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Order Statistics
  const fetchStatistics = async () => {
    try {
      const res = await sellerService.getOrderStatistics();
      if (res.data) {
        setStatistics(res.data);
      }
    } catch (err) {
      // Non-critical fallback
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  // When switching between Orders and Shipping mode, reset status tab to 'all' or default
  const handleModuleSwitch = (mod) => {
    setActiveModule(mod);
    setSelectedStatus('all');
    setPage(1);
    if (mod === 'shipping') {
      navigate('/shipping', { replace: true });
    } else {
      navigate('/orders', { replace: true });
    }
  };

  // Status Tabs for Order Management
  const orderStatusTabs = [
    { id: 'all', label: 'All Orders', count: statistics.totalOrders },
    { id: 'new', label: 'New Orders', count: statistics.newOrders },
    { id: 'pending', label: 'Pending Orders', count: statistics.pendingOrders },
    { id: 'confirmed', label: 'Confirmed Orders', count: statistics.confirmedOrders },
    { id: 'processing', label: 'Processing Orders', count: statistics.processingOrders },
    { id: 'cancelled', label: 'Cancelled Orders', count: statistics.cancelledOrders },
    { id: 'returned', label: 'Returned Orders', count: statistics.returnedOrders },
  ];

  // Status Tabs for Shipping Management
  const shippingStatusTabs = [
    { id: 'all', label: 'All Shipments' },
    { id: 'ready_to_ship', label: 'Ready to Ship', count: statistics.readyToShipOrders },
    { id: 'packing', label: 'Packing' },
    { id: 'pickup_scheduled', label: 'Pickup Scheduled' },
    { id: 'shipped', label: 'Shipped Orders', count: statistics.shippedOrders },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered', count: statistics.deliveredOrders },
    { id: 'ndr', label: 'NDR / Failed' },
    { id: 'rto', label: 'RTO Orders' },
  ];

  const currentTabs = activeModule === 'orders' ? orderStatusTabs : shippingStatusTabs;

  // Order Lifecycle Update Action
  const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
    setUpdating(true);
    try {
      const payload = { status: newStatus };
      if (reason) payload.reason = reason;
      await sellerService.updateOrderStatus(orderId, payload);
      toast.success(`Order moved to ${newStatus.replace(/_/g, ' ')}!`);
      fetchOrders();
      fetchStatistics();

      if (selectedOrder?._id === orderId) {
        const updated = await sellerService.getOrderById(orderId);
        const orderData = updated.data?.order || updated.data || updated;
        setSelectedOrder(orderData);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Rejection Modal Opener
  const openRejectModal = (orderId, action = 'rejected') => {
    setRejectOrderId(orderId);
    setRejectAction(action);
    setRejectReasonPreset('Out of stock');
    setRejectCustomReason('');
    setRejectModalOpen(true);
  };

  // Rejection Confirmed with Mandatory Reason
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    const finalReason =
      rejectReasonPreset === 'Other'
        ? rejectCustomReason.trim()
        : rejectCustomReason.trim()
        ? `${rejectReasonPreset} - ${rejectCustomReason.trim()}`
        : rejectReasonPreset;

    if (!finalReason) {
      toast.error('Please specify a mandatory rejection reason');
      return;
    }

    setUpdating(true);
    try {
      await sellerService.updateOrderStatus(rejectOrderId, {
        status: rejectAction,
        cancellationReason: finalReason,
        rejectReason: finalReason,
        notes: finalReason,
      });

      toast.success(`Order successfully ${rejectAction}!`);
      setRejectModalOpen(false);
      fetchOrders();
      fetchStatistics();

      if (selectedOrder?._id === rejectOrderId) {
        const updated = await sellerService.getOrderById(rejectOrderId);
        setSelectedOrder(updated.data?.order || updated.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reject order');
    } finally {
      setUpdating(false);
    }
  };

  // Open Shipping Booking / Configuration Modal
  const openShippingModal = (order) => {
    setShippingConfigOrder(order);
    setCourierPartner(order.shipping?.courierName || 'Delhivery');
    setPackageWeight(order.shipping?.weight || 0.5);
    setDimensions(order.shipping?.dimensions || { length: 15, width: 10, height: 5 });
    setPickupDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setShippingConfigModalOpen(true);
  };

  // Generate Shipping Label & Schedule Pickup
  const handleGenerateShippingLabel = async (e) => {
    e.preventDefault();
    if (!shippingConfigOrder) return;

    setUpdating(true);
    try {
      const res = await sellerService.generateShippingLabel(shippingConfigOrder._id, {
        courierPartner,
        weight: Number(packageWeight) || 0.5,
        dimensions,
      });

      toast.success('Shipping label generated & AWB assigned!');
      setGeneratedLabelData(res.data?.labelData || res.data);
      setLabelOrder(res.data?.order || shippingConfigOrder);
      setShippingConfigModalOpen(false);
      setLabelModalOpen(true);
      fetchOrders();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate shipping label');
    } finally {
      setUpdating(false);
    }
  };

  // Schedule Courier Pickup
  const handleSchedulePickup = async () => {
    if (!shippingConfigOrder) return;
    setUpdating(true);
    try {
      await sellerService.schedulePickup(shippingConfigOrder._id, {
        pickupDate,
        pickupSlot,
      });
      toast.success(`Pickup scheduled for ${pickupDate}!`);
      setShippingConfigModalOpen(false);
      fetchOrders();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule pickup');
    } finally {
      setUpdating(false);
    }
  };

  // Cancel Shipment
  const handleCancelShipment = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel the courier shipment?')) return;
    setUpdating(true);
    try {
      await sellerService.cancelShipment(orderId, {
        reason: 'Seller requested shipment cancellation',
      });
      toast.success('Shipment cancelled. Order reverted to Packed.');
      fetchOrders();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel shipment');
    } finally {
      setUpdating(false);
    }
  };

  // Open Printable Invoice Modal
  const openInvoiceModal = (order) => {
    setInvoiceOrder(order);
    setInvoiceModalOpen(true);
  };

  // Open Printable Shipping Label Modal
  const openLabelModal = (order) => {
    setLabelOrder(order);
    setGeneratedLabelData(null);
    setLabelModalOpen(true);
  };

  // Open Tracking Timeline Modal
  const openTrackingModal = (order) => {
    setTrackingTimelineOrder(order);
    setTrackingTimelineModalOpen(true);
  };

  // Filter local search for instant response
  const displayedOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNo = (order.subOrderNumber || order.orderNumber || order._id || '').toLowerCase();
    const custName = (order.shippingAddress?.fullName || order.customerName || '').toLowerCase();
    const phone = (order.customerPhone || order.shippingAddress?.mobileNumber || '').toLowerCase();
    const awb = (order.shipping?.awbNumber || order.shipping?.trackingNumber || '').toLowerCase();
    const city = (order.shippingAddress?.city || '').toLowerCase();
    const prodName = (order.items?.[0]?.name || '').toLowerCase();
    return (
      orderNo.includes(q) ||
      custName.includes(q) ||
      phone.includes(q) ||
      awb.includes(q) ||
      city.includes(q) ||
      prodName.includes(q)
    );
  });

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(displayedOrders.map((o) => o._id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }
    setBulkProcessing(true);
    try {
      const res = await sellerService.bulkUpdateOrders({
        orderIds: selectedOrderIds,
        action,
      });
      toast.success(res.message || `Bulk ${action} completed successfully!`);
      setSelectedOrderIds([]);
      fetchOrders();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || `Failed to bulk ${action} orders`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkInvoices = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order to generate slips');
      return;
    }
    setBulkProcessing(true);
    try {
      const res = await sellerService.bulkGetInvoices({ orderIds: selectedOrderIds });
      const invoiceData = res.data?.invoices || (Array.isArray(res.data) ? res.data : []);
      setBulkInvoices(invoiceData);
      setBulkInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Failed to generate bulk document slips');
    } finally {
      setBulkProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Submodule Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {activeModule === 'orders' ? 'Orders Management Center' : 'Shipping & Logistics Fleet'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Fulfillment
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {activeModule === 'orders'
              ? 'Inspect customer orders, accept/reject requests, start processing, and generate tax invoices.'
              : 'Pan-India courier logistics: book Delhivery, BlueDart, DTDC, print AWB labels & schedule pickups.'}
          </p>
        </div>

        {/* Submodule Navigation Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => handleModuleSwitch('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeModule === 'orders'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders Management</span>
            {statistics.totalOrders > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeModule === 'orders' ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-600'}`}>
                {statistics.totalOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => handleModuleSwitch('shipping')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeModule === 'shipping'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Shipping & Logistics</span>
            {statistics.readyToShipOrders + statistics.shippedOrders > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeModule === 'shipping' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'}`}>
                {statistics.readyToShipOrders + statistics.shippedOrders}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Status Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {currentTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700/80 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Search by Order ID, Customer Name, Mobile, SKU, AWB..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none text-xs"
              title="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none text-xs"
              title="End Date"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              fetchOrders();
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {(startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setPage(1);
                fetchOrders();
              }}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Reset
            </button>
          )}

          <button
            onClick={() => {
              fetchOrders();
              fetchStatistics();
            }}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Bulk Operations Bar (When items selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedOrderIds.length} orders selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('accept')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Bulk Accept
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('pack')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Bulk Pack
            </button>
            <button
              disabled={bulkProcessing}
              onClick={handleBulkInvoices}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Bulk Invoices</span>
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Data View: Orders Management View OR Shipping View (Cards or Table) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {viewMode === 'cards' ? (
          /* ============================================================== */
          /* CARD VIEW                                                      */
          /* ============================================================== */
          displayedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
              {displayedOrders.map((order) => {
                const firstItem = order.items?.[0] || {};
                const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isSelected = selectedOrderIds.includes(order._id);
                const totalAmount = order.subtotal || order.totalAmount || 0;
                const customerName = order.customerName || order.shippingAddress?.fullName || 'Customer';
                const customerPhone = order.customerPhone || order.shippingAddress?.mobileNumber || 'N/A';
                const city = order.shippingAddress?.city || 'Jaipur';
                const pinCode = order.shippingAddress?.pinCode || order.shippingAddress?.pincode || '302001';
                const itemsCount =
                  order.itemCount || order.items?.reduce((a, b) => a + (b.quantity || 1), 0) || 1;
                const isCod = (order.paymentMethod || '').toUpperCase().includes('COD');

                if (activeModule === 'orders') {
                  return (
                    <div
                      key={order._id}
                      className={`bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                          : 'border-gray-100 dark:border-slate-700/80'
                      }`}
                    >
                      {/* Card Header: Checkbox, Order ID, Date & Status */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOrder(order._id)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                                {order.subOrderNumber || order.orderNumber || order._id.slice(-8)}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    order.subOrderNumber || order.orderNumber,
                                    'Order ID'
                                  )
                                }
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                title="Copy Order ID"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-purple-500" />
                              {orderDate}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={order.status || 'pending'} size="sm" />
                      </div>

                      {/* Customer Info Card */}
                      <div className="p-3 bg-gray-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="font-black text-xs text-gray-900 dark:text-white truncate block">
                            {customerName}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1 font-bold text-emerald-600">
                              <PhoneCall className="w-3 h-3" />
                              {customerPhone}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-orange-500" />
                              {city}, {pinCode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            firstItem.image ||
                            firstItem.product?.images?.[0] ||
                            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                          }
                          alt="product"
                          className="w-14 h-14 rounded-2xl object-cover bg-gray-100 border border-gray-100 dark:border-slate-700 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-xs text-gray-900 dark:text-white line-clamp-1">
                            {firstItem.name || firstItem.product?.productName || 'Order Product'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                            <span>SKU: {firstItem.sku || 'SKU-IN'}</span>
                            <span>•</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              Qty: {itemsCount}
                            </span>
                          </div>
                          {order.items?.length > 1 && (
                            <span className="text-[10px] text-blue-600 font-extrabold block mt-0.5">
                              +{order.items.length - 1} more item(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financials & Payment Method */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Order Amount
                          </span>
                          <span className="text-base font-black text-blue-600 dark:text-blue-400">
                            ₹{totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Net: ₹{(order.netEarnings || totalAmount * 0.9).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                              isCod
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {order.paymentMethod || 'Online'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                            {order.paymentStatus || 'Completed'}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 text-center"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => openInvoiceModal(order)}
                          className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-colors"
                          title="Print Tax Invoice"
                        >
                          <Printer className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => openLabelModal(order)}
                          className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-colors"
                          title="Shipping Label"
                        >
                          <Tag className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // Shipping Logistics Card View
                  const courier = order.shipping?.courierName || 'Delhivery';
                  const awb = order.shipping?.awbNumber || 'AWB-PENDING';
                  const weight = order.shipping?.weight || 0.5;

                  return (
                    <div
                      key={order._id}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/80 transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700/60">
                        <div>
                          <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                            {order.subOrderNumber || order.orderNumber}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{orderDate}</span>
                        </div>
                        <StatusBadge status={order.status || 'ready_to_ship'} size="sm" />
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer:</span>
                          <span className="font-bold text-gray-900 dark:text-white">{customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Destination:</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            {city}, {pinCode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Courier Partner:</span>
                          <span className="font-extrabold text-blue-600">{courier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">AWB Tracking:</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {awb}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Parcel Weight:</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{weight} kg</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
                        <button
                          onClick={() => openShippingModal(order)}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 text-center flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Dispatch Courier</span>
                        </button>
                        <button
                          onClick={() => openLabelModal(order)}
                          className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                          title="Print Label"
                        >
                          <Printer className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30 text-blue-500" />
              <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                No orders matching this filter
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try selecting "All Orders" or clearing your search criteria.
              </p>
            </div>
          )
        ) : (
          /* ============================================================== */
          /* TABLE VIEW                                                     */
          /* ============================================================== */
          <div className="overflow-x-auto">
            {activeModule === 'orders' ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-extrabold">
                    <th className="py-4 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          displayedOrders.length > 0 &&
                          selectedOrderIds.length === displayedOrders.length
                        }
                        onChange={handleSelectAll}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-4 px-4">Order ID & Date</th>
                    <th className="py-4 px-4">Customer Details</th>
                    <th className="py-4 px-4">Product & SKU</th>
                    <th className="py-4 px-4 text-center">Qty</th>
                    <th className="py-4 px-4 text-right">Order Amount</th>
                    <th className="py-4 px-4">Payment</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Delivery Address</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => {
                      const firstItem = order.items?.[0] || {};
                      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      );
                      const isSelected = selectedOrderIds.includes(order._id);

                      return (
                        <tr
                          key={order._id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                            isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(order._id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-extrabold text-gray-900 dark:text-white block">
                              {order.subOrderNumber || order.orderNumber || order._id.slice(-8)}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{orderDate}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-gray-900 dark:text-white block">
                              {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-bold">
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              {order.customerPhone || order.shippingAddress?.mobileNumber || 'N/A'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  firstItem.image ||
                                  firstItem.product?.images?.[0] ||
                                  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                                }
                                alt="product"
                                className="w-10 h-10 rounded-2xl object-cover bg-gray-100 border border-gray-100 dark:border-slate-700 shrink-0 shadow-xs"
                              />
                              <div className="min-w-0">
                                <p className="font-black text-gray-900 dark:text-white truncate">
                                  {firstItem.name || firstItem.product?.productName || 'Product'}
                                </p>
                                <span className="font-mono text-[10px] text-gray-400 block">
                                  SKU: {firstItem.sku || 'SKU-IN'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {order.itemCount ||
                              order.items?.reduce((a, b) => a + (b.quantity || 1), 0) ||
                              1}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-black text-sm text-blue-600 dark:text-blue-400 block">
                              ₹{(order.subtotal || order.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              Net: ₹
                              {(
                                order.netEarnings ||
                                (order.subtotal || order.totalAmount || 0) * 0.9
                              ).toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                (order.paymentMethod || '').toUpperCase().includes('COD')
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {order.paymentMethod || 'Online'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                              {order.paymentStatus || 'Completed'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={order.status || 'pending'} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 max-w-[160px]">
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                              {order.shippingAddress?.city || 'Jaipur'},{' '}
                              {order.shippingAddress?.state || 'RJ'}
                            </p>
                            <span className="font-mono text-[10px] text-gray-400 font-semibold block">
                              PIN:{' '}
                              {order.shippingAddress?.pinCode ||
                                order.shippingAddress?.pincode ||
                                '302001'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3.5 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition-colors shadow-xs"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-16 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                          No orders matching this filter
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try selecting "All Orders" or clearing your search criteria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-extrabold">
                    <th className="py-4 px-4">Sub-Order & Date</th>
                    <th className="py-4 px-4">Customer & City</th>
                    <th className="py-4 px-4">Package Weight & Dim</th>
                    <th className="py-4 px-4">Courier Partner</th>
                    <th className="py-4 px-4">AWB & Tracking #</th>
                    <th className="py-4 px-4">Pickup Date / Slot</th>
                    <th className="py-4 px-4">Shipping Status</th>
                    <th className="py-4 px-4 text-center">Logistics Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => {
                      const courier = order.shipping?.courierName || 'Delhivery';
                      const awb = order.shipping?.awbNumber || 'AWB-PENDING';
                      const trk = order.shipping?.trackingNumber || 'BBIN-PENDING';
                      const weight = order.shipping?.weight || 0.5;
                      const dim = order.shipping?.dimensions || { length: 15, width: 10, height: 5 };

                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-extrabold text-gray-900 dark:text-white block">
                              {order.subOrderNumber || order.orderNumber}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                              {order.shippingAddress?.city}, {order.shippingAddress?.pinCode}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {weight} kg
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {dim.length}x{dim.width}x{dim.height} cm
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                {courier}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                              Pan-India Express
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-gray-900 dark:text-white block">
                              {awb}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 block mt-0.5">
                              {trk}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                              {order.shipping?.pickupScheduledDate
                                ? new Date(order.shipping.pickupScheduledDate).toLocaleDateString('en-IN')
                                : 'Not Scheduled'}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {order.shipping?.pickupSlot || '10:00 AM - 01:00 PM'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={order.status || 'ready_to_ship'} size="sm" />
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openLabelModal(order)}
                                className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 font-bold text-xs transition-colors"
                                title="Print Shipping Label"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openShippingModal(order)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] shadow-sm transition-colors flex items-center gap-1"
                                title="Book Courier / Schedule Pickup"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Dispatch</span>
                              </button>

                              <button
                                onClick={() => openTrackingModal(order)}
                                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-colors"
                                title="View Full Tracking Timeline"
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-16 text-gray-400">
                        <Truck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                          No shipments on file for this tab
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Move accepted orders to 'Packed' or 'Ready to Ship' to dispatch.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700/80 bg-gray-50/40 dark:bg-slate-900/20 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white">{displayedOrders.length}</strong> of{' '}
            <strong className="text-gray-900 dark:text-white">{totalCount}</strong> orders
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-3 py-1 font-bold text-gray-800 dark:text-gray-200">Page {page}</span>
            <button
              disabled={displayedOrders.length < limit && page * limit >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. ORDER DETAILS MODAL (VIEW DETAILS)                                */}
      {/* ==================================================================== */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details — ${selectedOrder.subOrderNumber || selectedOrder.orderNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-xs text-gray-800 dark:text-gray-200">
            {/* Top Status & Quick Action Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} size="lg" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Order Ref: {selectedOrder.orderNumber}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Print Invoice & Customer Chat Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openInvoiceModal(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GST Tax Invoice</span>
                </button>

                <button
                  onClick={() => openLabelModal(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Shipping Label</span>
                </button>

                <button
                  onClick={() => setCommunicationOrder(selectedOrder)}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  title="Message Customer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid: Customer Info & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Information Card */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-500">
                    Customer Information
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedOrder.customerPhone || selectedOrder.shippingAddress?.mobileNumber,
                        'Mobile Number'
                      )
                    }
                    className="text-gray-400 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Phone</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer Name:</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">
                      {selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile Phone:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedOrder.customerPhone || selectedOrder.shippingAddress?.mobileNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email Address:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {selectedOrder.customerEmail || 'customer@appecom.in'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-gray-500 block mb-1">Complete Delivery Address:</span>
                    <p className="font-semibold text-gray-900 dark:text-white leading-relaxed">
                      {selectedOrder.shippingAddress?.addressLine1 ||
                        selectedOrder.shippingAddress?.streetAddress ||
                        'Main Road'}
                      {selectedOrder.shippingAddress?.addressLine2
                        ? `, ${selectedOrder.shippingAddress.addressLine2}`
                        : ''}
                      , {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                      <strong className="text-indigo-600">
                        {selectedOrder.shippingAddress?.pinCode || selectedOrder.shippingAddress?.pincode}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information Card */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-500">
                    Payment Information
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedOrder.paymentStatus === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : selectedOrder.paymentStatus === 'Refunded'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {selectedOrder.paymentStatus || 'Pending'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-extrabold text-gray-900 dark:text-white uppercase">
                      {selectedOrder.paymentMethod || 'Online'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID / Ref:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {selectedOrder.order?.razorpayPaymentId ||
                        selectedOrder.transactionId ||
                        `TXN-${selectedOrder._id.slice(-8).toUpperCase()}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-bold">₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Platform Commission (10%):</span>
                    <span>-₹{selectedOrder.commissionAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-slate-800 text-sm font-black text-emerald-600">
                    <span>Net Seller Payout:</span>
                    <span>₹{selectedOrder.netEarnings?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Items Table */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-900 px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 font-extrabold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Product Details ({selectedOrder.items?.length || 1} Item)
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.image ||
                          item.product?.images?.[0] ||
                          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                        }
                        alt="Product"
                        className="w-14 h-14 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                      />
                      <div>
                        <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {item.name || item.product?.productName || 'Artisan Craft Item'}
                        </p>
                        <p className="font-mono text-[11px] text-gray-400 mt-0.5">
                          SKU: {item.sku || 'SKU-IN'} | GST: {item.gstPercentage || 18}%
                        </p>
                        {item.selectedVariant?.size && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            Size: {item.selectedVariant.size}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                        ₹{item.price?.toLocaleString('en-IN')} x {item.quantity || 1}
                      </p>
                      <p className="font-bold text-emerald-600 text-xs mt-0.5">
                        Total: ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier & Shipping Status (if available) */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                    Logistics Courier: {selectedOrder.shipping?.courierName || 'Delhivery Express'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                  AWB: {selectedOrder.shipping?.awbNumber || 'Assigned on Dispatch'} | Trk:{' '}
                  {selectedOrder.shipping?.trackingNumber || 'Pending'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openTrackingModal(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  Tracking Journey ({selectedOrder.shipping?.trackingHistory?.length || 1} Events)
                </button>
              </div>
            </div>

            {/* Order Lifecycle Action Workflow Buttons */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Accept Order Action */}
                {['new', 'pending'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'accepted')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Order</span>
                  </button>
                )}

                {/* Start Processing Action */}
                {['accepted', 'confirmed', 'new', 'pending'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Start Processing</span>
                  </button>
                )}

                {/* Mark as Packed Action */}
                {['processing', 'preparing', 'accepted'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'packed')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Mark as Packed</span>
                  </button>
                )}

                {/* Move to Ready to Ship Action */}
                {['packed', 'packing'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => openShippingModal(selectedOrder)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Ready to Ship & Dispatch</span>
                  </button>
                )}

                {/* Handover to Courier (Shipped) */}
                {['packed', 'packing', 'ready_to_ship', 'pickup_scheduled', 'ready_for_pickup'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'shipped')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Ship Order (Handover to Courier)</span>
                  </button>
                )}

                {/* Move to In Transit Action */}
                {['shipped'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'in_transit')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Move to In Transit</span>
                  </button>
                )}

                {/* Out for Delivery Action */}
                {['in_transit', 'picked_up'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'out_for_delivery')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Bike className="w-4 h-4" />
                    <span>Out for Delivery</span>
                  </button>
                )}

                {/* Mark as Delivered Action */}
                {['out_for_delivery'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Delivered</span>
                  </button>
                )}

                {/* Rejection / Cancellation Button (allowed before shipped) */}
                {!['shipped', 'delivered', 'cancelled', 'rejected'].includes(selectedOrder.status) && (
                  <button
                    disabled={updating}
                    onClick={() => openRejectModal(selectedOrder._id, 'rejected')}
                    className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Order</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-gray-600 dark:text-gray-300 text-xs transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* 7. DISPATCH & SHIPPING CONFIGURATION MODAL                           */}
      {/* ==================================================================== */}
      {shippingConfigModalOpen && shippingConfigOrder && (
        <Modal
          isOpen={shippingConfigModalOpen}
          onClose={() => setShippingConfigModalOpen(false)}
          title={`Configure Shipment — ${shippingConfigOrder.subOrderNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleGenerateShippingLabel} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Courier Partner
              </label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-bold text-xs"
              >
                <option value="Delhivery">Delhivery Pan-India Express</option>
                <option value="BlueDart">Blue Dart Apex Express</option>
                <option value="Shadowfax">Shadowfax Hyperlocal & Air</option>
                <option value="DTDC">DTDC Premier Express</option>
                <option value="India Post">India Post Speed Post</option>
                <option value="Shiprocket">Shiprocket Multi-Carrier Hub</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Dimensions (LxWxH cm)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    className="w-12 px-1.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs"
                    title="Length"
                  />
                  <span>x</span>
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    className="w-12 px-1.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs"
                    title="Width"
                  />
                  <span>x</span>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    className="w-12 px-1.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs"
                    title="Height"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Pickup Fields */}
            <div className="p-3 bg-gray-50 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2.5">
              <span className="font-extrabold text-xs text-gray-700 dark:text-gray-300 block">
                Warehouse Pickup Scheduling
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 mt-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Time Slot</label>
                  <select
                    value={pickupSlot}
                    onChange={(e) => setPickupSlot(e.target.value)}
                    className="w-full px-2.5 py-1.5 mt-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="Morning (10:00 AM - 01:00 PM)">10:00 AM - 01:00 PM</option>
                    <option value="Afternoon (02:00 PM - 06:00 PM)">02:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShippingConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Generate Label & AWB</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* 8. TRACKING TIMELINE HISTORY MODAL                                  */}
      {/* ==================================================================== */}
      {trackingTimelineModalOpen && trackingTimelineOrder && (
        <Modal
          isOpen={trackingTimelineModalOpen}
          onClose={() => setTrackingTimelineModalOpen(false)}
          title={`Logistics Journey — ${trackingTimelineOrder.subOrderNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                  {trackingTimelineOrder.shipping?.courierName || 'Delhivery Express'}
                </p>
                <p className="font-mono text-[10px] text-gray-500">
                  AWB: {trackingTimelineOrder.shipping?.awbNumber || 'Assigned'}
                </p>
              </div>
              <StatusBadge status={trackingTimelineOrder.status} size="sm" />
            </div>

            {/* Vertical Visual Timeline */}
            <div className="relative pl-6 space-y-4 border-l-2 border-indigo-200 dark:border-indigo-800 ml-3 py-1">
              {(trackingTimelineOrder.shipping?.trackingHistory || [
                {
                  status: 'Order Placed',
                  location: trackingTimelineOrder.shippingAddress?.city || 'Jaipur',
                  timestamp: trackingTimelineOrder.createdAt,
                  remarks: 'Customer placed order successfully',
                },
              ]).map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Step Dot */}
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div>
                    <p className="font-extrabold text-xs text-gray-900 dark:text-white">
                      {event.status}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold">{event.location}</p>
                    {event.remarks && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{event.remarks}</p>
                    )}
                    <span className="text-[9px] font-mono text-gray-400 block mt-1">
                      {new Date(event.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingTimelineModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl"
              >
                Close Journey
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* 9. REJECTION & CANCELLATION MODAL WITH MANDATORY REASON             */}
      {/* ==================================================================== */}
      {rejectModalOpen && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Mandatory Rejection / Cancellation Reason"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-rose-800 dark:text-rose-200 text-xs">
                In compliance with seller performance policies, a mandatory reason is required to
                reject or cancel an order. This will be shared with the customer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Reason Category
              </label>
              <select
                value={rejectReasonPreset}
                onChange={(e) => setRejectReasonPreset(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Out of stock">Out of stock / Inventory shortage</option>
                <option value="Delivery address not serviceable">
                  Delivery address not serviceable by courier partners
                </option>
                <option value="Pricing discrepancy or catalog error">
                  Pricing discrepancy or catalog error
                </option>
                <option value="Customer requested cancellation">
                  Customer requested cancellation before dispatch
                </option>
                <option value="Unable to fulfill delivery timeline">
                  Unable to fulfill delivery timeline
                </option>
                <option value="Other">Other (Custom explanation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Additional Remarks / Details (Mandatory if "Other")
              </label>
              <textarea
                rows={3}
                value={rejectCustomReason}
                onChange={(e) => setRejectCustomReason(e.target.value)}
                placeholder="Explain the specific reason for rejecting this order..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* 10. MODAL EMBEDDINGS (INVOICE, SHIPPING LABEL, BULK, CHAT)           */}
      {/* ==================================================================== */}
      <OrderInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={invoiceOrder}
        seller={seller}
      />

      <ShippingLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        order={labelOrder}
        labelData={generatedLabelData}
      />

      <BulkInvoiceModal
        isOpen={bulkInvoiceModalOpen}
        onClose={() => setBulkInvoiceModalOpen(false)}
        invoices={bulkInvoices}
      />

      {communicationOrder && (
        <OrderCommunicationModal
          isOpen={!!communicationOrder}
          onClose={() => setCommunicationOrder(null)}
          order={communicationOrder}
        />
      )}
    </div>
  );
};

export default Orders;
