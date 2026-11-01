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

module.exports = {
  getDeliveryPartners,
  getDeliveryPartnerDetails,
  updateDeliveryPartnerStatus,
  getDeliveryPayouts,
  updateDeliveryPayoutStatus,
};

