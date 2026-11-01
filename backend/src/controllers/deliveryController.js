const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const shippingService = require('../services/shippingService');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

/**
 * Check delivery serviceability for a 6-digit Indian PIN code
 * GET /api/delivery/check-pincode/:pinCode
 * POST /api/delivery/check-pincode
 */
const checkPinCodeServiceability = asyncHandler(async (req, res) => {
  const pinCode = req.params.pinCode || req.body.pinCode;
  const orderAmount = req.query.orderAmount || req.body.orderAmount || 0;

  if (!pinCode) {
    return errorResponse(res, 'PIN code is required', 400);
  }

  const result = shippingService.checkPinCodeServiceability(pinCode, orderAmount);

  if (!result.serviceable) {
    return errorResponse(res, result.message, 400, { pinCode });
  }

  return successResponse(res, result, 'PIN code is serviceable for Pan India delivery');
});

/**
 * Quick lookup to auto-fill State and City from a 6-digit PIN Code
 * GET /api/delivery/pincode-info/:pinCode
 */
const getPinCodeInfo = asyncHandler(async (req, res) => {
  const { pinCode } = req.params;

  if (!shippingService.isValidPinCode(pinCode)) {
    return errorResponse(res, 'Invalid 6-digit Indian PIN code format', 400);
  }

  const details = shippingService.getPinCodeDetails(pinCode);
  if (!details) {
    return errorResponse(res, 'PIN code not found in directory', 404);
  }

  return successResponse(
    res,
    {
      pinCode: details.pinCode,
      city: details.city,
      state: details.state,
      region: details.region,
      transitDays: details.transitDays,
      isCodAvailable: details.isCodAvailable,
    },
    'PIN code details retrieved'
  );
});

/**
 * Track shipment by Order ID or Tracking Number
 * GET /api/delivery/track/:identifier
 */
const trackShipment = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const order = await Order.findOne({
    $or: [
      { orderId: identifier },
      { 'shippingDetails.trackingNumber': identifier },
      ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
    ],
  });

  if (!order) {
    return errorResponse(res, 'Shipment not found for provided order/tracking ID', 404);
  }

  const tracking = shippingService.getSimulatedTracking(order);

  return successResponse(res, tracking, 'Shipment tracking information retrieved');
});

// ==========================================================
// DELIVERY PARTNER ROLE APIS
// ==========================================================

/**
 * Delivery Partner Login
 * POST /api/delivery/auth/login
 */
const deliveryLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  const partner = await DeliveryPartner.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!partner) {
    return errorResponse(res, 'Invalid credentials for delivery partner account', 401);
  }

  const isMatch = await partner.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 'Invalid credentials for delivery partner account', 401);
  }

  const accessToken = generateAccessToken(partner._id, 'delivery');
  const refreshToken = generateRefreshToken(partner._id);

  const safePartner = partner.toObject();
  delete safePartner.password;

  return successResponse(
    res,
    {
      partner: safePartner,
      accessToken,
      refreshToken,
      token: accessToken,
    },
    'Delivery partner logged in successfully'
  );
});

/**
 * Get Current Delivery Partner Profile & Dashboard Stats
 * GET /api/delivery/profile
 */
const getDeliveryProfile = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
  return successResponse(res, { partner }, 'Profile retrieved');
});

/**
 * Get Assigned Delivery Tasks
 * GET /api/delivery/tasks
 */
const getAssignedTasks = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
  const tasks = partner.assignedTasks || [];
  return successResponse(res, { tasks }, 'Assigned delivery tasks retrieved');
});

/**
 * Update Delivery Task Status
 * PATCH /api/delivery/tasks/:taskId/status
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body; // 'picked_up' | 'out_for_delivery'

  const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
  const task = partner.assignedTasks.id(taskId);

  if (!task) {
    return errorResponse(res, 'Delivery task not found', 404);
  }

  task.status = status;
  await partner.save();

  // If order exists, also update order status
  if (task.order) {
    await Order.findByIdAndUpdate(task.order, {
      orderStatus: status === 'out_for_delivery' ? 'out_for_delivery' : 'processing',
    });
  }

  return successResponse(res, { task }, `Task marked as ${status}`);
});

/**
 * Verify Customer OTP & Confirm Delivery
 * POST /api/delivery/tasks/:taskId/verify-otp
 */
const verifyDeliveryOtp = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { otp } = req.body;

  const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
  const task = partner.assignedTasks.id(taskId);

  if (!task) {
    return errorResponse(res, 'Delivery task not found', 404);
  }

  if (task.deliveryOtp && task.deliveryOtp !== (otp || '').trim()) {
    return errorResponse(res, 'Incorrect 4-digit Customer Delivery OTP', 400);
  }

  task.status = 'delivered';
  task.deliveredAt = new Date();

  // Credit delivery fee (e.g. ₹50) to delivery partner
  partner.earnings.available += task.deliveryFee || 50;
  partner.earnings.totalEarned += task.deliveryFee || 50;
  if (partner.earnings.pending >= (task.deliveryFee || 50)) {
    partner.earnings.pending -= task.deliveryFee || 50;
  }

  await partner.save();

  // Update main order
  if (task.order) {
    await Order.findByIdAndUpdate(task.order, {
      orderStatus: 'delivered',
      paymentStatus: 'completed',
    });
  }

  return successResponse(
    res,
    { task, earnings: partner.earnings },
    'Delivery successfully completed & verified!'
  );
});

module.exports = {
  checkPinCodeServiceability,
  getPinCodeInfo,
  trackShipment,
  deliveryLogin,
  getDeliveryProfile,
  getAssignedTasks,
  updateTaskStatus,
  verifyDeliveryOtp,
};
