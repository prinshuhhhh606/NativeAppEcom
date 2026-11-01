const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinaryService = require('../services/cloudinaryService');
const paymentService = require('../services/paymentService');

/**
 * Submit a return request for an order
 * POST /api/returns
 */
const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, items, reason, comments, refundMethod } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  if (order.orderStatus !== 'Delivered') {
    return errorResponse(res, 'Returns are only permitted for delivered orders', 400);
  }

  // Check 7-day return policy window
  const deliveryDate = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    return errorResponse(res, 'Return window (7 days from delivery) has expired', 400);
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'returns');
    images = uploaded.map((img) => img.url);
  }

  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items || [];

  // Calculate refund amount based on returned items
  const refundAmount = parsedItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

  const returnRequest = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    items: parsedItems,
    reason,
    comments,
    images,
    refundAmount,
    refundMethod: refundMethod || 'Original',
  });

  return successResponse(res, returnRequest, 'Return request submitted successfully', 201);
});

/**
 * Get current user's return requests
 * GET /api/returns/my-returns
 */
const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ user: req.user._id })
    .populate('order', 'orderId orderStatus createdAt')
    .sort({ createdAt: -1 });

  return successResponse(res, returns, 'Return requests retrieved');
});

/**
 * Get return request details
 * GET /api/returns/:id
 */
const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id)
    .populate('order')
    .populate('user', 'name email phone');

  if (!returnRequest) {
    return errorResponse(res, 'Return request not found', 404);
  }

  if (returnRequest.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied', 403);
  }

  return successResponse(res, returnRequest, 'Return request details retrieved');
});

/**
 * [Admin] Update return request status
 * PATCH /api/returns/:id/status
 */
const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const returnRequest = await ReturnRequest.findById(req.params.id).populate('order');
  if (!returnRequest) {
    return errorResponse(res, 'Return request not found', 404);
  }

  returnRequest.status = status;
  if (adminNotes) returnRequest.adminNotes = adminNotes;

  // If approved and refunded
  if (status === 'Refunded' && returnRequest.order.razorpayPaymentId) {
    try {
      await paymentService.processRefund(
        returnRequest.order.razorpayPaymentId,
        returnRequest.refundAmount,
        { returnRequestId: returnRequest._id.toString() }
      );
    } catch (refundErr) {
      console.warn('Refund dispatch notice:', refundErr.message);
    }
  }

  await returnRequest.save();

  return successResponse(res, returnRequest, 'Return status updated successfully');
});

module.exports = {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  updateReturnStatus,
};

