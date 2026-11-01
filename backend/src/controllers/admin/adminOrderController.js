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
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['OutForDelivery', 'Returned'],
  OutForDelivery: ['Delivered', 'Returned'],
  Delivered: ['Return Requested'],
  'Return Requested': ['Returned', 'Delivered'],
  Returned: ['Refund Initiated', 'Refunded'],
  'Refund Initiated': ['Refunded'],
  Refunded: [],
  Cancelled: [],
};

/**
 * List orders with status filters, date range & search
 * GET /api/v1/admin/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const { status, search, paymentMethod, paymentStatus, startDate, endDate } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.orderStatus = status;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { orderId: regex },
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
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return successResponse(res, orders, 'Orders retrieved successfully', 200, {
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
  const isCustomId = req.params.id.startsWith('BBIN-');
  const query = isCustomId ? { orderId: req.params.id } : { _id: req.params.id };

  const order = await Order.findOne(query)
    .populate('user', 'name email phone createdAt')
    .populate('items.product', 'name images sku brand');

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  return successResponse(res, order, 'Order details fetched');
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
  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'Paid';
    }
  } else if (status === 'Cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = note || 'Cancelled by Admin';

    // Restore stock atomically
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      await Inventory.findOneAndUpdate({ product: item.product }, { $inc: { currentStock: item.quantity } });
      await InventoryTransaction.create({
        product: item.product,
        sku: item.name,
        type: 'ORDER_RESTORE',
        previousQuantity: 0,
        newQuantity: item.quantity,
        changeQuantity: item.quantity,
        reason: `Order ${order.orderId} cancelled`,
        admin: req.admin?._id,
        order: order._id,
      });
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

  if (['Confirmed', 'Processing', 'Packed'].includes(order.orderStatus)) {
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
    .populate('user', 'name email phone')
    .populate('items.product', 'name sku');

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const settings = (await StoreSetting.findOne()) || {
    storeName: 'Bharat Bazaar Pan India Store',
    gstNumber: '29ABCDE1234F1Z5',
    invoicePrefix: 'INV-BBIN-',
  };

  const invoiceNumber = `${settings.invoicePrefix || 'INV-'}${order.orderId.replace('BBIN-', '')}`;

  // GST Breakdown (standard Indian 18% GST split into 9% CGST + 9% SGST or 18% IGST)
  const gstTotal = order.pricing?.gst || 0;
  const isInterState = order.shippingAddress?.state !== (settings.storeAddress?.state || 'Karnataka');

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
      name: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pinCode}`,
    },
    items: order.items.map((item, idx) => ({
      srNo: idx + 1,
      name: item.name,
      variant: `${item.variant?.size || ''} ${item.variant?.color || ''}`.trim() || 'Standard',
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    })),
    pricing: {
      subtotal: order.pricing.subtotal,
      discount: order.pricing.discount,
      shipping: order.pricing.shipping,
      gst: gstTotal,
      cgst: isInterState ? 0 : Math.round(gstTotal / 2),
      sgst: isInterState ? 0 : Math.round(gstTotal / 2),
      igst: isInterState ? gstTotal : 0,
      grandTotal: order.pricing.grandTotal,
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      transactionId: order.razorpayPaymentId || 'N/A',
    },
  };

  return successResponse(res, invoice, 'Invoice generated successfully');
});

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignCourier,
  getOrderInvoice,
};

