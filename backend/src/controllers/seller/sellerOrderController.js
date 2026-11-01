/**
 * Seller Order Management Controller
 * Handles seller-specific sub-orders, order lifecycle, shipping labels & packing slips
 */
const SellerOrder = require('../../models/SellerOrder');
const Seller = require('../../models/Seller');
const SellerLedger = require('../../models/SellerLedger');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { getIO } = require('../../sockets/socketManager');

/**
 * List Seller Sub-Orders with Status Filters
 * GET /api/v1/seller/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const query = { seller: sellerId };

  if (status && status !== 'all') {
    if (status === 'processing_all') {
      query.status = { $in: ['accepted', 'processing', 'packed', 'ready_for_pickup'] };
    } else {
      query.status = status;
    }
  }

  if (search) {
    query.$or = [
      { subOrderNumber: { $regex: search, $options: 'i' } },
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { 'shipping.trackingNumber': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [orders, totalCount] = await Promise.all([
    SellerOrder.find(query).sort(sort).skip(skip).limit(Number(limit)),
    SellerOrder.countDocuments(query),
  ]);

  return successResponse(res, orders, 'Seller orders fetched', 200, {
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
  }).populate('order', 'orderStatus paymentStatus paymentMethod');

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  return successResponse(res, order, 'Order details retrieved');
});

/**
 * Update Order Fulfillment Status
 * PATCH /api/v1/seller/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, courierName, trackingNumber, cancellationReason } = req.body || {};
  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });

  if (!order) {
    return errorResponse(res, 'Order not found or access denied', 404);
  }

  const allowedTransitions = {
    new: ['accepted', 'cancelled'],
    accepted: ['processing', 'packed', 'cancelled'],
    processing: ['packed', 'cancelled'],
    packed: ['ready_for_pickup', 'shipped', 'cancelled'],
    ready_for_pickup: ['shipped'],
    shipped: ['delivered'],
    delivered: ['return_requested'],
    cancelled: [],
    returned: [],
  };

  const validNextStatuses = allowedTransitions[order.status] || [];
  if (!validNextStatuses.includes(status)) {
    return errorResponse(
      res,
      `Cannot transition order from '${order.status}' to '${status}'. Allowed next steps: ${validNextStatuses.join(', ')}`,
      400
    );
  }

  order.status = status;

  if (status === 'ready_for_pickup' || status === 'shipped') {
    if (courierName) order.shipping.courierName = courierName;
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber.trim();
    if (!order.shipping.trackingNumber) {
      order.shipping.trackingNumber = 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
    }
    if (status === 'shipped') {
      order.shipping.shippedAt = new Date();
    }
  }

  if (status === 'delivered') {
    order.shipping.deliveredAt = new Date();
    order.paymentStatus = 'Completed';

    // Credit seller's available balance upon verified delivery!
    const seller = await Seller.findById(order.seller);
    if (seller) {
      seller.balance.available += order.netEarnings;
      seller.balance.totalEarned += order.netEarnings;
      if (seller.balance.pending >= order.netEarnings) {
        seller.balance.pending -= order.netEarnings;
      }
      await seller.save();

      // Record in Financial Ledger
      await SellerLedger.create({
        transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
        seller: seller._id,
        type: 'credit',
        category: 'order_sale',
        amount: order.netEarnings,
        balanceAfter: seller.balance.available,
        referenceId: order.subOrderNumber,
        description: `Settlement credited for delivered order ${order.subOrderNumber}`,
        status: 'cleared',
      });
    }
  }

  if (status === 'cancelled') {
    order.cancelledReason = cancellationReason || 'Cancelled by seller';
    order.cancelledAt = new Date();
    order.cancellationSource = 'seller';
  }

  await order.save();

  // Real-time broadcast to Customer and Admin
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('order_status_updated', {
        orderId: order._id,
        subOrderNumber: order.subOrderNumber,
        newStatus: status,
        sellerId: req.seller._id,
      });
    }
  } catch (err) {}

  return successResponse(res, order, `Order status updated to ${status}`);
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

module.exports = {
  getOrders,
  getOrder,
  updateOrderStatus,
  getOrderInvoice,
};

