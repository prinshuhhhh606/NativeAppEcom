/**
 * Admin Delivery Partner Management Controller
 * Handles logistics fleet onboarding, KYC approval, status changes, and performance review.
 */
const DeliveryPartner = require('../../models/DeliveryPartner');
const DeliveryAssignment = require('../../models/DeliveryAssignment');
const DeliveryPayout = require('../../models/DeliveryPayout');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { emitToDeliveryPartner } = require('../../sockets/socketManager');

/**
 * List All Delivery Partners
 * GET /api/v1/admin/delivery-partners
 */
const getDeliveryPartners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, vehicleType } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.kycStatus = status;
  }

  if (vehicleType && vehicleType !== 'all') {
    query.vehicleType = vehicleType;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { vehicleNumber: { $regex: search, $options: 'i' } },
      { drivingLicenseNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [partners, totalCount] = await Promise.all([
    DeliveryPartner.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    DeliveryPartner.countDocuments(query),
  ]);

  return successResponse(res, partners, 'Delivery partners fetched successfully', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Get Specific Delivery Partner Details
 * GET /api/v1/admin/delivery-partners/:id
 */
const getDeliveryPartnerDetails = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.params.id);
  if (!partner) {
    return errorResponse(res, 'Delivery partner not found', 404);
  }

  const totalAssigned = await DeliveryAssignment.countDocuments({ deliveryPartner: partner._id });
  const completedDeliveries = await DeliveryAssignment.countDocuments({
    deliveryPartner: partner._id,
    status: 'delivered',
  });

  return successResponse(
    res,
    {
      partner,
      stats: {
        totalAssigned,
        completedDeliveries,
      },
    },
    'Delivery partner details retrieved'
  );
});

/**
 * Update Delivery Partner Verification Status (Approve / Reject / Suspend)
 * PATCH /api/v1/admin/delivery-partners/:id/status
 */
const updateDeliveryPartnerStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks } = req.body || {};

  const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'blocked'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid delivery partner status provided', 400);
  }

  const partner = await DeliveryPartner.findById(req.params.id);
  if (!partner) {
    return errorResponse(res, 'Delivery partner not found', 404);
  }

  partner.kycStatus = status;
  if (adminRemarks !== undefined) partner.adminRemarks = adminRemarks;
  if (status === 'approved') {
    partner.isVerified = true;
    partner.isActive = true;
  } else if (status === 'suspended' || status === 'blocked' || status === 'rejected') {
    partner.isAvailable = false;
    partner.availability = 'offline';
  }

  await partner.save();

  // Notify Rider in real-time
  try {
    emitToDeliveryPartner(partner._id, 'account_status_updated', {
      kycStatus: status,
      adminRemarks: partner.adminRemarks,
      updatedAt: new Date(),
    });
  } catch (e) {}

  return successResponse(res, partner, `Delivery partner status updated to ${status}`);
});

/**
 * List Delivery Partner Payout Requests
 * GET /api/v1/admin/delivery-payouts
 */
const getDeliveryPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payouts, totalCount] = await Promise.all([
    DeliveryPayout.find(query)
      .populate('deliveryPartner', 'name phone vehicleType vehicleNumber email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    DeliveryPayout.countDocuments(query),
  ]);

  return successResponse(res, payouts, 'Delivery payouts retrieved successfully', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Update Delivery Partner Payout Status (Approve / Settle / Reject)
 * PATCH /api/v1/admin/delivery-payouts/:id/status
 */
const updateDeliveryPayoutStatus = asyncHandler(async (req, res) => {
  const { status, referenceNumber, adminRemarks } = req.body || {};
  const validStatuses = ['approved', 'processing', 'completed', 'rejected'];

  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid delivery payout status', 400);
  }

  const payout = await DeliveryPayout.findById(req.params.id);
  if (!payout) {
    return errorResponse(res, 'Payout record not found', 404);
  }

  // Prevent duplicate processing
  if (payout.status === 'completed' || payout.status === 'rejected') {
    return errorResponse(res, `Payout is already marked as ${payout.status} and cannot be modified`, 400);
  }

  payout.status = status;
  if (referenceNumber) payout.referenceNumber = referenceNumber;
  if (adminRemarks) payout.adminRemarks = adminRemarks;

  if (status === 'completed') {
    payout.processedAt = new Date();
  }

  // If rejected, refund the money back to rider available balance
  if (status === 'rejected') {
    await DeliveryPartner.findByIdAndUpdate(payout.deliveryPartner, {
      $inc: { 'earnings.available': payout.amount },
    });
  }

  await payout.save();

  return successResponse(res, payout, `Delivery payout status updated to ${status}`);
});

/**
 * Live GPS Fleet Monitoring
 * GET /api/v1/admin/delivery-partners/live-map
 */
const getLiveFleetMap = asyncHandler(async (req, res) => {
  const Delivery = require('../../models/Delivery');

  const [activeDeliveries, onlineRiders] = await Promise.all([
    Delivery.find({
      status: {
        $in: ['assigned', 'reached_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'reached_customer'],
      },
    })
      .populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating currentLocation profilePhoto')
      .populate('order', 'orderId orderNumber deliveryAddress pickupAddress totalAmount')
      .lean(),
    DeliveryPartner.find({ isAvailable: true, kycStatus: 'approved' })
      .select('name phone vehicleType vehicleNumber rating currentLocation availability')
      .lean(),
  ]);

  return successResponse(
    res,
    {
      activeDeliveries: activeDeliveries.map((d) => ({
        deliveryId: d._id,
        orderId: d.order?.orderId || d.orderNumber || d.order?.orderNumber,
        status: d.status,
        partner: d.deliveryPartner,
        pickup: d.order?.pickupAddress || { latitude: 26.9124, longitude: 75.7873 },
        destination: d.order?.deliveryAddress || { latitude: 26.9015, longitude: 75.7421 },
        currentLocation: d.currentLocation || d.deliveryPartner?.currentLocation,
        updatedAt: d.updatedAt,
      })),
      onlineRiders,
      totalActiveDeliveries: activeDeliveries.length,
      totalOnlineRiders: onlineRiders.length,
    },
    'Live fleet tracking data retrieved successfully'
  );
});

/**
 * Manually Assign / Reassign Order to Delivery Partner
 * POST /api/v1/admin/delivery-partners/assign-order
 */
const assignOrderManually = asyncHandler(async (req, res) => {
  const orderId = req.body.orderId;
  const partnerId = req.body.deliveryPartnerId || req.body.partnerId;

  if (!orderId || !partnerId) {
    return errorResponse(res, 'Order ID and Delivery Partner ID are required', 400);
  }

  const Order = require('../../models/Order');
  const Delivery = require('../../models/Delivery');
  const { syncParentOrderStatus } = require('../../utils/orderSync');

  const [partner, order] = await Promise.all([
    DeliveryPartner.findById(partnerId),
    Order.findOne({ $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }),
  ]);

  if (!partner) return errorResponse(res, 'Delivery partner not found', 404);
  if (!order) return errorResponse(res, 'Order not found', 404);

  // Update or create Delivery record
  let delivery = await Delivery.findOne({ order: order._id });
  if (!delivery) {
    delivery = new Delivery({
      order: order._id,
      orderNumber: order.orderNumber,
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      deliveryPartnerPhone: partner.phone,
      deliveryPartnerVehicle: partner.vehicleType,
      status: 'assigned',
      pickupOtp: '7821',
      deliveryOtp: order.deliveryOtp || '4521',
    });
  } else {
    delivery.deliveryPartner = partner._id;
    delivery.deliveryPartnerName = partner.name;
    delivery.deliveryPartnerPhone = partner.phone;
    delivery.deliveryPartnerVehicle = partner.vehicleType;
    delivery.status = 'assigned';
  }
  await delivery.save();

  // Update order
  order.deliveryPartner = partner._id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.deliveryPartnerVehicle = partner.vehicleType;
  order.orderStatus = 'delivery_partner_assigned';
  order.assignedAt = new Date();
  await order.save();

  try {
    await syncParentOrderStatus(order._id);
  } catch (e) {}

  return successResponse(
    res,
    { orderId: order.orderId, partner: partner.name },
    `Order #${order.orderId} assigned to ${partner.name} successfully`
  );
});

module.exports = {
  getDeliveryPartners,
  getDeliveryPartnerDetails,
  updateDeliveryPartnerStatus,
  getDeliveryPayouts,
  updateDeliveryPayoutStatus,
  getLiveFleetMap,
  assignOrderManually,
};

