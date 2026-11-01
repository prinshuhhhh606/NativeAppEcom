const Shipment = require('../../models/Shipment');
const Order = require('../../models/Order');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const shippingService = require('../../services/shippingService');

/**
 * List shipments with status filter & pagination
 * GET /api/v1/admin/shipping
 */
const getShipments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status, search } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ trackingNumber: regex }, { courierName: regex }];
  }

  const [shipments, total] = await Promise.all([
    Shipment.find(filter)
      .populate('order', 'orderId shippingAddress pricing.grandTotal')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Shipment.countDocuments(filter),
  ]);

  return successResponse(res, shipments, 'Shipments retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Create Shipment with Courier (Shiprocket-compatible Adapter)
 * POST /api/v1/admin/shipping/create
 */
const createShipment = asyncHandler(async (req, res) => {
  const { orderId, courierName } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Check if shipment already created
  let shipment = await Shipment.findOne({ order: order._id });
  if (shipment) {
    return errorResponse(res, 'Shipment already exists for this order', 400);
  }

  const courier = courierName || 'Delhivery Pan-India Express';
  const trackingNumber = `AWB${Date.now().toString().slice(-9)}`;
  const shiprocketId = `SR-${Date.now().toString().slice(-8)}`;

  shipment = await Shipment.create({
    order: order._id,
    shiprocketShipmentId: shiprocketId,
    courierName: courier,
    trackingNumber,
    awbCode: trackingNumber,
    labelUrl: `https://appecom.in/labels/${trackingNumber}.pdf`,
    status: 'Manifested',
    estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    activityLog: [
      {
        status: 'Manifested',
        activity: 'Shipping label generated and order packed',
        location: 'Bengaluru Fulfillment Center',
        timestamp: new Date(),
      },
    ],
  });

  // Update order's shipping details
  order.shippingDetails = {
    courierName: courier,
    trackingNumber,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,
  };
  order.orderStatus = 'Shipped';
  await order.save();

  recordAuditLog(req, 'SHIPMENT_CREATED', 'shipping', shipment._id, {
    orderId: order.orderId,
    courier,
    trackingNumber,
  });

  return successResponse(res, shipment, 'Shipment created and tracking assigned', 201);
});

/**
 * Update Shipment Status
 * PATCH /api/v1/admin/shipping/:id/status
 */
const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { status, location, activity } = req.body;

  const shipment = await Shipment.findById(req.params.id).populate('order');
  if (!shipment) {
    return errorResponse(res, 'Shipment not found', 404);
  }

  shipment.status = status;
  shipment.activityLog.push({
    status,
    activity: activity || `Status updated to ${status}`,
    location: location || 'Transit Hub',
    timestamp: new Date(),
  });

  await shipment.save();

  // Sync with order status
  if (shipment.order) {
    if (status === 'Out for Delivery') {
      shipment.order.orderStatus = 'OutForDelivery';
      await shipment.order.save();
    } else if (status === 'Delivered') {
      shipment.order.orderStatus = 'Delivered';
      shipment.order.deliveredAt = new Date();
      if (shipment.order.paymentMethod === 'COD') shipment.order.paymentStatus = 'Paid';
      await shipment.order.save();
    }
  }

  recordAuditLog(req, 'SHIPMENT_STATUS_UPDATED', 'shipping', shipment._id, { status });

  return successResponse(res, shipment, 'Shipment status updated');
});

module.exports = {
  getShipments,
  createShipment,
  updateShipmentStatus,
};

