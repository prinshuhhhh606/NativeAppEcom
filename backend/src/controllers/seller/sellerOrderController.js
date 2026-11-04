/**
 * Seller Order Management Controller
 * Handles seller-specific sub-orders, order lifecycle, shipping labels & packing slips
 */
const SellerOrder = require('../../models/SellerOrder');
const Seller = require('../../models/Seller');
const SellerLedger = require('../../models/SellerLedger');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { getIO, emitToOrder } = require('../../sockets/socketManager');
const notificationService = require('../../services/notificationService');
const { syncParentOrderStatus } = require('../../utils/orderSync');

/**
 * List Seller Sub-Orders with Status Filters
 * GET /api/v1/seller/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 20, status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Ensure seller sees all orders placed for their store
  const query = { seller: sellerId };

  if (status && status !== 'all') {
    const s = status.toLowerCase().trim();
    if (s === 'pending' || s === 'new' || s === 'placed') {
      query.status = { $in: ['pending', 'new', 'placed'] };
    } else if (s === 'confirmed' || s === 'accepted') {
      query.status = { $in: ['confirmed', 'accepted'] };
    } else if (s === 'processing' || s === 'preparing') {
      query.status = { $in: ['processing', 'preparing', 'processing_completed', 'packing', 'packed'] };
    } else if (s === 'packing') {
      query.status = { $in: ['packing', 'packed'] };
    } else if (s === 'ready_to_ship' || s === 'ready_for_pickup') {
      query.status = { $in: ['ready_to_ship', 'ready_for_pickup', 'pickup_scheduled'] };
    } else if (s === 'pickup_scheduled') {
      query.status = 'pickup_scheduled';
    } else if (s === 'shipped') {
      query.status = { $in: ['shipped', 'picked_up', 'in_transit', 'out_for_delivery'] };
    } else if (s === 'in_transit') {
      query.status = 'in_transit';
    } else if (s === 'out_for_delivery') {
      query.status = 'out_for_delivery';
    } else if (s === 'delivered') {
      query.status = 'delivered';
    } else if (s === 'cancelled') {
      query.status = 'cancelled';
    } else if (s === 'rejected') {
      query.status = 'rejected';
    } else if (s === 'cancelled_or_rejected') {
      query.status = { $in: ['cancelled', 'rejected'] };
    } else if (s === 'returned' || s === 'return_requests' || s === 'returns') {
      query.status = {
        $in: [
          'return_requested',
          'return_approved',
          'return_rejected',
          'return_pickup',
          'returned',
          'refund_processing',
          'refunded',
          'exchange_requested',
        ],
      };
    } else if (s === 'ndr') {
      query.status = { $in: ['ndr', 'delivery_failed'] };
    } else if (s === 'rto') {
      query.status = 'rto';
    } else {
      query.status = s;
    }
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (search) {
    query.$or = [
      { subOrderNumber: { $regex: search, $options: 'i' } },
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
      { 'shipping.trackingNumber': { $regex: search, $options: 'i' } },
      { 'shipping.awbNumber': { $regex: search, $options: 'i' } },
      { 'items.name': { $regex: search, $options: 'i' } },
      { 'items.sku': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [orders, totalCount] = await Promise.all([
    SellerOrder.find(query)
      .populate('items.product', 'images productName name price sku brand')
      .populate('order', 'orderStatus paymentStatus paymentMethod deliveryAddress createdAt')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    SellerOrder.countDocuments(query),
  ]);

  return successResponse(res, { orders, totalCount }, 'Seller orders fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Get Specific Seller Order Details
 * GET /api/v1/seller/orders/:id
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await SellerOrder.findOne({
    $or: [{ _id: req.params.id }, { subOrderNumber: req.params.id }],
    seller: req.seller._id,
  })
    .populate('items.product', 'images productName name price sku brand')
    .populate('order', 'orderStatus paymentStatus paymentMethod deliveryAddress createdAt');

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  return successResponse(res, { order }, 'Order details retrieved');
});

/**
 * Update Order Fulfillment Status
 * PATCH /api/v1/seller/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, courierName, trackingNumber, awbNumber, cancellationReason, rejectReason, rejectionReason, notes } = req.body || {};
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  const targetStatus = (status || '').toLowerCase().trim();

  const allowedTransitions = {
    new: ['accepted', 'confirmed', 'processing', 'preparing', 'cancelled', 'rejected'],
    pending: ['accepted', 'confirmed', 'processing', 'preparing', 'cancelled', 'rejected'],
    placed: ['accepted', 'confirmed', 'processing', 'preparing', 'cancelled', 'rejected'],
    confirmed: ['accepted', 'processing', 'preparing', 'packing', 'packed', 'ready_to_ship', 'ready_for_pickup', 'cancelled', 'rejected'],
    accepted: ['processing', 'preparing', 'packing', 'packed', 'ready_to_ship', 'ready_for_pickup', 'cancelled', 'rejected'],
    processing: ['preparing', 'processing_completed', 'packing', 'packed', 'ready_to_ship', 'ready_for_pickup', 'cancelled'],
    preparing: ['processing_completed', 'packed', 'ready_to_ship', 'ready_for_pickup', 'cancelled'],
    processing_completed: ['packed', 'ready_to_ship', 'ready_for_pickup', 'pickup_scheduled', 'cancelled'],
    packing: ['packed', 'ready_to_ship', 'ready_for_pickup', 'pickup_scheduled', 'cancelled'],
    packed: ['ready_to_ship', 'ready_for_pickup', 'pickup_scheduled', 'shipped', 'cancelled'],
    ready_to_ship: ['ready_for_pickup', 'pickup_scheduled', 'shipped', 'cancelled'],
    ready_for_pickup: ['pickup_scheduled', 'shipped', 'out_for_delivery', 'cancelled'],
    pickup_scheduled: ['shipped', 'picked_up', 'out_for_delivery', 'cancelled'],
    picked_up: ['in_transit', 'out_for_delivery', 'delivered'],
    shipped: ['in_transit', 'out_for_delivery', 'ndr', 'delivered'],
    in_transit: ['out_for_delivery', 'ndr', 'delivered'],
    out_for_delivery: ['delivered', 'ndr'],
    ndr: ['rto', 'out_for_delivery'],
    rto: [],
    delivered: ['return_requested'],
    return_requested: ['return_approved', 'return_rejected'],
    return_approved: ['return_pickup'],
    return_rejected: [],
    return_pickup: ['returned'],
    returned: ['refund_processing'],
    refund_processing: ['refunded'],
    refunded: [],
    cancelled: [],
    rejected: [],
  };

  const currentStatus = order.status || 'pending';
  const validNextStatuses = allowedTransitions[currentStatus] || [];

  if (!validNextStatuses.includes(targetStatus)) {
    return errorResponse(
      res,
      `Cannot transition order from '${currentStatus}' to '${targetStatus}'. Allowed next steps: ${validNextStatuses.join(', ')}`,
      400
    );
  }

  // Mandatory rejection / cancellation reason validation
  if (targetStatus === 'cancelled' || targetStatus === 'rejected') {
    const reasonText = rejectionReason || cancellationReason || rejectReason || notes || '';
    if (!reasonText || !reasonText.trim()) {
      return errorResponse(res, 'A mandatory reason is required to reject or cancel this order.', 400);
    }
    order.cancelledReason = reasonText.trim();
    order.rejectionReason = reasonText.trim();
    order.cancelledAt = new Date();
    order.rejectedAt = new Date();
    order.cancellationSource = 'seller';

    // If order was prepaid, automatically initiate refund
    if (order.paymentStatus === 'Completed' || order.paymentStatus === 'paid') {
      order.paymentStatus = 'Refunded';
    }
  }

  if (targetStatus === 'accepted') {
    order.acceptedAt = new Date();
  } else if (targetStatus === 'preparing') {
    order.preparingAt = new Date();
  } else if (targetStatus === 'ready_for_pickup') {
    order.readyForPickupAt = new Date();
  }

  order.status = targetStatus;

  // Initialize shipping object if needed
  order.shipping = order.shipping || {};
  order.shipping.trackingHistory = order.shipping.trackingHistory || [];

  if (courierName) order.shipping.courierName = courierName;
  if (trackingNumber) order.shipping.trackingNumber = trackingNumber.trim();
  if (awbNumber) order.shipping.awbNumber = awbNumber.trim();

  if (['ready_to_ship', 'ready_for_pickup', 'pickup_scheduled', 'shipped'].includes(targetStatus)) {
    if (!order.shipping.trackingNumber) {
      order.shipping.trackingNumber = 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
    }
    if (!order.shipping.awbNumber) {
      order.shipping.awbNumber = 'AWB' + Math.floor(1000000000 + Math.random() * 9000000000);
    }
    if (targetStatus === 'shipped') {
      order.shipping.shippedAt = new Date();
    }
  }

  if (targetStatus === 'delivered') {
    order.shipping.deliveredAt = new Date();
    order.paymentStatus = 'Completed';
  }

  // Record tracking timeline step
  const statusLabels = {
    accepted: 'Order Accepted by Seller',
    confirmed: 'Order Confirmed',
    processing: 'Processing in Warehouse',
    preparing: 'Order Being Prepared by Seller',
    processing_completed: 'Order Processing Completed',
    packing: 'Package Being Packed',
    packed: 'Packaging Complete',
    ready_to_ship: 'Package Ready to Ship',
    ready_for_pickup: 'Order Ready for Pickup',
    pickup_scheduled: 'Courier Pickup Scheduled',
    shipped: 'Handed Over to Courier',
    picked_up: 'Picked Up by Delivery Partner',
    in_transit: 'Shipment In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Successfully Delivered',
    cancelled: 'Order Cancelled',
    rejected: 'Order Rejected by Seller',
    return_requested: 'Return Requested',
    return_approved: 'Return Approved',
    return_rejected: 'Return Rejected',
    returned: 'Product Received Back',
    refunded: 'Refund Completed',
    ndr: 'Delivery Attempt Failed (NDR)',
    rto: 'Return to Origin (RTO)',
  };

  order.shipping.trackingHistory.push({
    status: statusLabels[targetStatus] || targetStatus.toUpperCase().replace(/_/g, ' '),
    location: req.seller.storeName || req.seller.city || 'Logistics Hub',
    timestamp: new Date(),
    remarks: notes || `Order status updated to ${targetStatus}`,
  });

  await order.save();

  // Synchronize parent Order status & tracking timeline across all customer & seller views
  try {
    await syncParentOrderStatus(order.order || order.orderNumber);
  } catch (syncErr) {
    console.warn('Parent order sync error:', syncErr?.message);
  }

  // Trigger Customer Notification for this milestone update
  try {
    if (order.user) {
      await notificationService.sendCustomerFulfillmentNotification(
        order.user,
        order,
        targetStatus,
        order.cancelledReason
      );
    }
  } catch (notifErr) {
    console.warn('Customer notification error:', notifErr?.message);
  }

  // Real-time broadcast to Customer, Seller and Admin rooms
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('order_status_updated', {
        orderId: order._id,
        subOrderNumber: order.subOrderNumber,
        newStatus: targetStatus,
        sellerId: req.seller._id,
      });
      io.emit('seller:order_status_updated', {
        orderId: order._id,
        subOrderNumber: order.subOrderNumber,
        newStatus: targetStatus,
        sellerId: req.seller._id,
      });
      if (order.user) {
        io.to(order.user.toString()).emit('customer:order_status_updated', {
          orderId: order.order,
          orderNumber: order.orderNumber,
          subOrderNumber: order.subOrderNumber,
          status: targetStatus,
        });
      }

      // Broadcast to Order Room for Live Tracking screen with all alias keys
      const trackingPayload = {
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        parentOrderId: order.order ? order.order.toString() : '',
        subOrderNumber: order.subOrderNumber,
        status: targetStatus,
        orderStatus: targetStatus,
        timestamp: new Date(),
      };
      emitToOrder(order.orderNumber, 'order:status_updated', trackingPayload);
      if (order.order) {
        emitToOrder(order.order.toString(), 'order:status_updated', trackingPayload);
      }
      emitToOrder(order.subOrderNumber, 'order:status_updated', trackingPayload);
    }
  } catch (err) {}

  return successResponse(res, { order }, `Order status updated to ${targetStatus}`);
});

/**
 * Generate Shipping Label & Invoice Document
 * GET /api/v1/seller/orders/:id/invoice
 */
const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const invoiceData = {
    invoiceNumber: `INV-${order.subOrderNumber}`,
    invoiceDate: order.createdAt,
    seller: {
      name: req.seller.name,
      businessName: req.seller.businessName,
      storeName: req.seller.storeName,
      gstin: req.seller.gstin,
      pan: req.seller.panNumber,
      pickupAddress: req.seller.address,
    },
    customer: {
      name: order.customerName,
      shippingAddress: order.shippingAddress,
    },
    subOrderNumber: order.subOrderNumber,
    items: order.items,
    subtotal: order.subtotal,
    commissionAmount: order.commissionAmount,
    netEarnings: order.netEarnings,
    courierName: order.shipping.courierName,
    trackingNumber: order.shipping.trackingNumber,
  };

  return successResponse(res, invoiceData, 'Invoice data generated successfully');
});

/**
 * Bulk Process Orders (Accept, Pack, Ready For Pickup)
 * POST /api/v1/seller/orders/bulk-update
 */
const bulkUpdateOrders = asyncHandler(async (req, res) => {
  const { orderIds = [], action } = req.body || {};

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return errorResponse(res, 'Please provide an array of order IDs to process', 400);
  }

  const validActions = ['accept', 'pack', 'ready_for_pickup'];
  if (!validActions.includes(action)) {
    return errorResponse(res, `Invalid bulk action. Allowed: ${validActions.join(', ')}`, 400);
  }

  const targetStatusMap = {
    accept: { newStatus: 'accepted', eligibleCurrent: ['new'] },
    pack: { newStatus: 'packed', eligibleCurrent: ['accepted', 'processing'] },
    ready_for_pickup: { newStatus: 'ready_for_pickup', eligibleCurrent: ['packed'] },
  };

  const { newStatus, eligibleCurrent } = targetStatusMap[action];

  const orders = await SellerOrder.find({
    _id: { $in: orderIds },
    seller: req.seller._id,
  });

  const updatedIds = [];
  const skippedOrders = [];

  for (const order of orders) {
    if (eligibleCurrent.includes(order.status)) {
      order.status = newStatus;
      if (newStatus === 'ready_for_pickup' && !order.shipping.trackingNumber) {
        order.shipping.trackingNumber = 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
      }
      await order.save();
      try {
        await syncParentOrderStatus(order.order || order.orderNumber);
      } catch (e) {}
      updatedIds.push(order._id);
    } else {
      skippedOrders.push({
        orderId: order._id,
        orderNumber: order.subOrderNumber,
        currentStatus: order.status,
        reason: `Order is '${order.status}', cannot be bulk-${action}ed`,
      });
    }
  }

  return successResponse(
    res,
    {
      updatedCount: updatedIds.length,
      skippedCount: skippedOrders.length,
      updatedIds,
      skippedOrders,
    },
    `Bulk ${action} completed: ${updatedIds.length} orders updated, ${skippedOrders.length} skipped`
  );
});

/**
 * Bulk Generate Packing Slips and Invoices
 * POST /api/v1/seller/orders/bulk-invoices
 */
const bulkGetInvoices = asyncHandler(async (req, res) => {
  const { orderIds = [] } = req.body || {};

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return errorResponse(res, 'Please provide an array of order IDs', 400);
  }

  const orders = await SellerOrder.find({
    _id: { $in: orderIds },
    seller: req.seller._id,
  }).sort({ createdAt: -1 });

  const slips = orders.map((order) => ({
    invoiceNumber: `INV-${order.subOrderNumber}`,
    invoiceDate: order.createdAt,
    seller: {
      storeName: req.seller.storeName || req.seller.businessName,
      businessName: req.seller.businessName,
      gstin: req.seller.gstin || '08AABCU9603R1ZM',
      pickupAddress: req.seller.address,
    },
    customer: {
      name: order.customerName,
      shippingAddress: order.shippingAddress,
    },
    subOrderNumber: order.subOrderNumber,
    items: order.items,
    subtotal: order.subtotal,
    commissionAmount: order.commissionAmount,
    netEarnings: order.netEarnings,
    courierName: order.shipping.courierName || 'Bharat Express Fleet',
    trackingNumber: order.shipping.trackingNumber || `BBIN-${order.subOrderNumber}`,
    status: order.status,
  }));

  return successResponse(res, slips, `Generated ${slips.length} bulk document slips`);
});

/**
 * Generate Shipping Label with Courier Partner & Dimensions
 * POST /api/v1/seller/orders/:id/shipping-label
 */
const generateShippingLabel = asyncHandler(async (req, res) => {
  const { courierPartner = 'Delhivery', weight = 0.5, dimensions } = req.body || {};
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  const awb = order.shipping?.awbNumber || 'AWB' + Math.floor(1000000000 + Math.random() * 9000000000);
  const prefix = (courierPartner || 'DEL').substring(0, 3).toUpperCase();
  const tracking = order.shipping?.trackingNumber || (prefix + '-' + Math.floor(10000000 + Math.random() * 90000000));

  order.shipping = order.shipping || {};
  order.shipping.courierName = courierPartner;
  order.shipping.awbNumber = awb;
  order.shipping.trackingNumber = tracking;
  order.shipping.weight = Number(weight) || 0.5;

  if (dimensions) {
    order.shipping.dimensions = {
      length: Number(dimensions.length) || 15,
      width: Number(dimensions.width) || 10,
      height: Number(dimensions.height) || 5,
    };
  }

  if (['pending', 'new', 'accepted', 'processing', 'packing', 'packed'].includes(order.status)) {
    order.status = 'ready_to_ship';
  }

  order.shipping.trackingHistory = order.shipping.trackingHistory || [];
  order.shipping.trackingHistory.push({
    status: 'Shipping Label Generated',
    location: req.seller.storeName || 'Jaipur Central Hub',
    timestamp: new Date(),
    remarks: `Courier Partner: ${courierPartner}, AWB: ${awb}, Wt: ${order.shipping.weight} kg`,
  });

  await order.save();

  const labelData = {
    subOrderNumber: order.subOrderNumber,
    orderNumber: order.orderNumber,
    courierName: order.shipping.courierName,
    awbNumber: order.shipping.awbNumber,
    trackingNumber: order.shipping.trackingNumber,
    weight: order.shipping.weight,
    dimensions: order.shipping.dimensions,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    seller: {
      storeName: req.seller.storeName || req.seller.businessName,
      address: req.seller.address,
      phone: req.seller.phone,
    },
    items: order.items,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    generatedAt: new Date(),
  };

  return successResponse(res, { order, labelData }, 'Shipping label generated successfully');
});

/**
 * Schedule Courier Pickup
 * POST /api/v1/seller/orders/:id/schedule-pickup
 */
const schedulePickup = asyncHandler(async (req, res) => {
  const { pickupDate, pickupSlot = 'Morning (10:00 AM - 01:00 PM)', notes = '' } = req.body || {};
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  order.shipping = order.shipping || {};
  order.shipping.pickupScheduledDate = pickupDate ? new Date(pickupDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  order.shipping.pickupSlot = pickupSlot;
  order.status = 'pickup_scheduled';

  order.shipping.trackingHistory = order.shipping.trackingHistory || [];
  order.shipping.trackingHistory.push({
    status: 'Pickup Scheduled',
    location: req.seller.storeName || 'Warehouse',
    timestamp: new Date(),
    remarks: `Pickup arranged for ${new Date(order.shipping.pickupScheduledDate).toDateString()} (${pickupSlot}). ${notes}`,
  });

  await order.save();
  try {
    await syncParentOrderStatus(order.order || order.orderNumber);
  } catch (e) {}

  return successResponse(res, { order }, `Pickup scheduled for ${new Date(order.shipping.pickupScheduledDate).toDateString()}`);
});

/**
 * Cancel Scheduled Shipment
 * POST /api/v1/seller/orders/:id/cancel-shipment
 */
const cancelShipment = asyncHandler(async (req, res) => {
  const { reason = 'Seller requested shipment cancellation' } = req.body || {};
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  order.status = 'packed';
  order.shipping = order.shipping || {};
  order.shipping.trackingHistory = order.shipping.trackingHistory || [];
  order.shipping.trackingHistory.push({
    status: 'Shipment Cancelled',
    location: req.seller.storeName || 'Hub',
    timestamp: new Date(),
    remarks: `Shipment cancelled: ${reason}`,
  });

  await order.save();
  try {
    await syncParentOrderStatus(order.order || order.orderNumber);
  } catch (e) {}

  return successResponse(res, { order }, 'Shipment cancelled. Order reverted to Packed status.');
});

/**
 * Get Comprehensive Order & Shipping Statistics for Dashboard & Orders View
 * GET /api/v1/seller/orders/statistics
 */
const getOrderStatistics = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  // Include all store orders in statistics
  const baseFilter = { seller: sellerId };

  const [
    totalOrders,
    newOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    readyToShipOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    returnedOrders,
  ] = await Promise.all([
    SellerOrder.countDocuments(baseFilter),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['new', 'pending'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['pending', 'new'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['confirmed', 'accepted'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['processing', 'packing', 'packed'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['ready_to_ship', 'ready_for_pickup', 'pickup_scheduled'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['shipped', 'in_transit', 'out_for_delivery'] } }),
    SellerOrder.countDocuments({ ...baseFilter, status: 'delivered' }),
    SellerOrder.countDocuments({ ...baseFilter, status: { $in: ['cancelled', 'rejected'] } }),
    SellerOrder.countDocuments({
      ...baseFilter,
      status: {
        $in: [
          'return_requested',
          'return_approved',
          'return_rejected',
          'return_pickup',
          'returned',
          'refund_processing',
          'refunded',
          'exchange_requested',
        ],
      },
    }),
  ]);

  return successResponse(
    res,
    {
      totalOrders,
      newOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      readyToShipOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
    },
    'Order statistics retrieved successfully'
  );
});

/**
 * Dedicated Accept Order Endpoint
 * POST /api/v1/seller/orders/:id/accept
 */
const acceptOrder = asyncHandler(async (req, res) => {
  req.body.status = 'accepted';
  return updateOrderStatus(req, res);
});

/**
 * Dedicated Reject Order Endpoint
 * POST /api/v1/seller/orders/:id/reject
 */
const rejectOrder = asyncHandler(async (req, res) => {
  req.body.status = 'rejected';
  return updateOrderStatus(req, res);
});

module.exports = {
  getOrders,
  getOrder,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  getOrderInvoice,
  bulkUpdateOrders,
  bulkGetInvoices,
  generateShippingLabel,
  schedulePickup,
  cancelShipment,
  getOrderStatistics,
};

