const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Inventory = require('../../models/Inventory');
const InventoryTransaction = require('../../models/InventoryTransaction');
const StoreSetting = require('../../models/StoreSetting');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const { emitOrderStatusUpdated } = require('../../sockets/socketManager');
const notificationService = require('../../services/notificationService');

// Valid status transitions map
const VALID_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Preparing', 'Cancelled'],
  Preparing: ['Packed', 'Ready for Pickup', 'ready_for_pickup', 'Cancelled'],
  Processing: ['Packed', 'Ready for Pickup', 'ready_for_pickup', 'Cancelled'],
  Packed: ['Ready for Pickup', 'ready_for_pickup', 'Shipped', 'Cancelled'],
  'Ready for Pickup': ['delivery_partner_assigned', 'Picked Up', 'Shipped', 'Cancelled'],
  ready_for_pickup: ['delivery_partner_assigned', 'picked_up', 'Picked Up', 'Shipped', 'Cancelled'],
  delivery_partner_assigned: ['Picked Up', 'picked_up', 'Cancelled'],
  'Picked Up': ['Shipped', 'shipped', 'in_transit', 'Cancelled'],
  picked_up: ['Shipped', 'shipped', 'in_transit', 'Cancelled'],
  Shipped: ['OutForDelivery', 'out_for_delivery', 'Returned', 'Cancelled'],
  shipped: ['out_for_delivery', 'OutForDelivery', 'Returned', 'Cancelled'],
  in_transit: ['out_for_delivery', 'OutForDelivery', 'Returned', 'Cancelled'],
  OutForDelivery: ['Delivered', 'delivered', 'Returned', 'Cancelled'],
  out_for_delivery: ['Delivered', 'delivered', 'Returned', 'Cancelled'],
  Delivered: ['Return Requested', 'Refund Requested'],
  delivered: ['Return Requested', 'Refund Requested'],
  'Return Requested': ['Returned', 'Delivered'],
  Returned: ['Refund Initiated', 'Refunded'],
  'Refund Initiated': ['Refunded'],
  Refunded: [],
  Cancelled: [],
};

/**
 * List orders with 15-tab status filters, search & date range
 * GET /api/v1/admin/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status, search, paymentMethod, paymentStatus, startDate, endDate, sellerId } = req.query;
  const filter = {};

  // Status mapping for the 15 tabs
  if (status && status !== 'all') {
    const s = status.toLowerCase();
    if (s === 'new') {
      filter.orderStatus = { $in: ['Placed', 'placed', 'Pending', 'pending', 'new', 'New'] };
    } else if (s === 'pending') {
      filter.orderStatus = { $in: ['Pending', 'Confirmed', 'Accepted', 'seller_accepted'] };
    } else if (s === 'confirmed') {
      filter.orderStatus = { $in: ['Confirmed', 'confirmed', 'Accepted', 'accepted'] };
    } else if (s === 'preparing') {
      filter.orderStatus = { $in: ['Preparing', 'preparing', 'Processing', 'processing', 'Packed', 'packed'] };
    } else if (s === 'ready_for_pickup') {
      filter.orderStatus = { $in: ['ready_for_pickup', 'Ready for Pickup', 'pickup_scheduled'] };
    } else if (s === 'delivery_requested') {
      filter.orderStatus = { $in: ['ready_for_pickup', 'Ready for Pickup', 'delivery_requested'] };
    } else if (s === 'delivery_partner_assigned') {
      filter.orderStatus = { $in: ['delivery_partner_assigned', 'assigned', 'delivery_partner_accepted'] };
    } else if (s === 'picked_up') {
      filter.orderStatus = { $in: ['picked_up', 'Picked Up'] };
    } else if (s === 'shipped') {
      filter.orderStatus = { $in: ['Shipped', 'shipped', 'in_transit'] };
    } else if (s === 'out_for_delivery') {
      filter.orderStatus = { $in: ['OutForDelivery', 'out_for_delivery', 'reached_customer'] };
    } else if (s === 'delivered') {
      filter.orderStatus = { $in: ['Delivered', 'delivered', 'completed'] };
    } else if (s === 'cancelled') {
      filter.orderStatus = { $in: ['Cancelled', 'cancelled', 'Rejected', 'rejected'] };
    } else if (s === 'refund_requested') {
      filter.orderStatus = { $in: ['Return Requested', 'refund_requested', 'return_requested'] };
    } else if (s === 'refunded') {
      filter.orderStatus = { $in: ['Refunded', 'refunded'] };
    } else {
      filter.orderStatus = status;
    }
  }

  if (sellerId) {
    filter.sellers = sellerId;
  }

  if (paymentMethod && paymentMethod !== 'all') {
    filter.paymentMethod = paymentMethod;
  }

  if (paymentStatus && paymentStatus !== 'all') {
    filter.paymentStatus = paymentStatus;
  }

  if (search) {
    const trimmed = search.trim();
    const regex = new RegExp(trimmed, 'i');
    filter.$or = [
      { orderId: regex },
      { orderNumber: regex },
      { 'deliveryAddress.fullName': regex },
      { 'deliveryAddress.mobileNumber': regex },
      { 'deliveryAddress.phone': regex },
      { 'shippingAddress.fullName': regex },
      { 'shippingAddress.phone': regex },
      { 'shippingAddress.pinCode': regex },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'fullName name email phone mobileNumber')
      .populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating')
      .populate('sellers', 'storeName ownerName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const formattedOrders = orders.map((o) => ({
    ...o,
    orderId: o.orderId || o.orderNumber,
    customerName:
      o.deliveryAddress?.fullName ||
      o.shippingAddress?.fullName ||
      o.user?.fullName ||
      o.user?.name ||
      'Customer',
    customerPhone:
      o.deliveryAddress?.mobileNumber ||
      o.deliveryAddress?.phone ||
      o.shippingAddress?.phone ||
      o.user?.mobileNumber ||
      o.user?.phone ||
      '',
    totalAmount: o.totalAmount || o.pricing?.grandTotal || 0,
  }));

  return successResponse(res, formattedOrders, 'Orders retrieved successfully', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get detailed order by ID or orderId string
 * GET /api/v1/admin/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const isMongoId = targetId.match(/^[0-9a-fA-F]{24}$/);
  const query = isMongoId
    ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
    : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };

  const order = await Order.findOne(query)
    .populate('user', 'fullName name email phone mobileNumber createdAt')
    .populate('items.product', 'name productName images sku brand price')
    .populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating profilePhoto currentLocation')
    .populate('sellers', 'storeName ownerName phone address email')
    .lean();

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  return successResponse(
    res,
    {
      ...order,
      orderId: order.orderId || order.orderNumber,
      amount: order.totalAmount || order.pricing?.grandTotal || 0,
    },
    'Order details fetched'
  );
});

/**
 * Update Order Status with Validation & Stock Handling
 * PATCH /api/v1/admin/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const currentStatus = order.orderStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (allowed && !allowed.includes(status) && req.admin?.role !== 'super_admin') {
    return errorResponse(
      res,
      `Cannot transition order from "${currentStatus}" to "${status}". Allowed transitions: ${allowed.join(', ') || 'None'}`,
      400
    );
  }

  order.orderStatus = status;

  // Set timestamps for milestones
  if (['Delivered', 'delivered'].includes(status)) {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'Paid';
    }
  } else if (['Cancelled', 'cancelled'].includes(status)) {
    order.cancelledAt = new Date();
    order.cancellationReason = note || 'Cancelled by Admin';

    // Restore stock atomically
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      await Inventory.findOneAndUpdate({ product: item.product }, { $inc: { currentStock: item.quantity } });
    }
  }

  await order.save();

  // Send push notification & emit real-time socket
  notificationService.sendOrderNotification(order.user, order, status.toLowerCase()).catch(() => {});
  emitOrderStatusUpdated(order);

  recordAuditLog(req, 'ORDER_STATUS_UPDATED', 'orders', order._id, {
    orderId: order.orderId,
    previousStatus: currentStatus,
    newStatus: status,
    note,
  });

  return successResponse(res, order, `Order status updated to ${status}`);
});

/**
 * Assign Courier & Tracking AWB
 * PATCH /api/v1/admin/orders/:id/courier
 */
const assignCourier = asyncHandler(async (req, res) => {
  const { courierName, trackingNumber, estimatedDeliveryDate } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  order.shippingDetails = {
    courierName: courierName || 'Delhivery Pan-India Express',
    trackingNumber: trackingNumber || `AWB${Date.now().toString().slice(-9)}`,
    estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  };

  if (['Confirmed', 'Processing', 'Packed', 'Ready for Pickup'].includes(order.orderStatus)) {
    order.orderStatus = 'Shipped';
  }

  await order.save();
  emitOrderStatusUpdated(order);

  recordAuditLog(req, 'COURIER_ASSIGNED', 'orders', order._id, {
    orderId: order.orderId,
    courierName: order.shippingDetails.courierName,
    trackingNumber: order.shippingDetails.trackingNumber,
  });

  return successResponse(res, order, 'Courier details updated and order dispatched');
});

/**
 * Generate Structured Printable Invoice Data
 * GET /api/v1/admin/orders/:id/invoice
 */
const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name fullName email phone mobileNumber')
    .populate('items.product', 'name productName sku');

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const settings = (await StoreSetting.findOne()) || {
    storeName: 'Bharat Bazaar Pan India Store',
    gstNumber: '29ABCDE1234F1Z5',
    invoicePrefix: 'INV-BBIN-',
  };

  const invoiceNumber = `${settings.invoicePrefix || 'INV-'}${order.orderId.replace('BBIN-', '')}`;
  const gstTotal = order.tax || order.pricing?.gst || 0;

  const address = order.deliveryAddress || order.shippingAddress || {};
  const customerName = address.fullName || order.user?.fullName || order.user?.name || 'Customer';
  const customerAddress = `${address.addressLine1 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pinCode || address.pincode || ''}`;

  const invoice = {
    invoiceNumber,
    date: order.createdAt,
    store: {
      name: settings.storeName,
      address: settings.storeAddress,
      gstin: settings.gstNumber,
      email: settings.contactEmail,
      phone: settings.contactPhone,
    },
    customer: {
      name: customerName,
      phone: address.mobileNumber || address.phone || order.user?.phone,
      address: customerAddress,
    },
    items: order.items.map((item, idx) => ({
      srNo: idx + 1,
      name: item.name,
      variant: `${item.selectedVariant?.size || item.variant?.size || ''} ${item.selectedVariant?.color || item.variant?.color || ''}`.trim() || 'Standard',
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    })),
    pricing: {
      subtotal: order.subtotal || order.pricing?.subtotal || 0,
      discount: order.discount || order.pricing?.discount || 0,
      shipping: order.deliveryCharges || order.pricing?.shipping || 0,
      gst: gstTotal,
      grandTotal: order.totalAmount || order.pricing?.grandTotal || 0,
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      transactionId: order.razorpayPaymentId || 'N/A',
    },
  };

  return successResponse(res, invoice, 'Invoice generated successfully');
});

/**
 * Export Orders to CSV
 * GET /api/v1/admin/orders/export/csv
 */
const exportOrdersCSV = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name fullName email phone')
    .sort({ createdAt: -1 })
    .lean();

  const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Total Amount', 'Status', 'Payment Method', 'Payment Status'];
  const rows = orders.map((o) => [
    `"${o.orderId || o.orderNumber}"`,
    `"${new Date(o.createdAt).toLocaleDateString('en-IN')}"`,
    `"${o.deliveryAddress?.fullName || o.shippingAddress?.fullName || o.user?.fullName || o.user?.name || 'Customer'}"`,
    `"${o.deliveryAddress?.mobileNumber || o.deliveryAddress?.phone || o.shippingAddress?.phone || ''}"`,
    o.items?.length || 1,
    o.totalAmount || o.pricing?.grandTotal || 0,
    `"${o.orderStatus}"`,
    `"${o.paymentMethod || 'UPI'}"`,
    `"${o.paymentStatus || 'Pending'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bharat_bazaar_orders.csv"');
  return res.send(csvContent);
});

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignCourier,
  getOrderInvoice,
  exportOrdersCSV,
};
