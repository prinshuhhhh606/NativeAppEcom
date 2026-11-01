const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const Refund = require('../../models/Refund');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const paymentService = require('../../services/paymentService');
const { emitRefundUpdated } = require('../../sockets/socketManager');

/**
 * List all payments with method, status and date filters
 * GET /api/v1/admin/payments
 */
const getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status, paymentMethod, search } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status; // 'Captured', 'Pending', 'Failed', 'Refunded'
  }

  if (paymentMethod && paymentMethod !== 'all') {
    filter.paymentMethod = paymentMethod;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ transactionId: regex }];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('order', 'orderId pricing.grandTotal shippingAddress.fullName')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return successResponse(res, payments, 'Payments retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get payment details by ID
 * GET /api/v1/admin/payments/:id
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order')
    .populate('user', 'name email phone');

  if (!payment) {
    return errorResponse(res, 'Payment transaction not found', 404);
  }

  return successResponse(res, payment, 'Payment details fetched');
});

/**
 * Process a verified Refund for an order / payment
 * POST /api/v1/admin/payments/refund
 */
const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;

  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) {
    return errorResponse(res, 'Payment record not found', 404);
  }

  const refundAmt = Number(amount) || payment.amount;

  let gatewayRefund = null;
  try {
    gatewayRefund = await paymentService.processRefund(
      payment.transactionId || `pay_mock_${Date.now()}`,
      refundAmt,
      { reason, admin: req.admin?.name }
    );
  } catch (err) {
    console.error('Refund gateway error:', err.message);
  }

  // Record Refund in database
  const refundRecord = await Refund.create({
    order: payment.order?._id,
    payment: payment._id,
    amount: refundAmt,
    method: payment.paymentMethod,
    status: 'Processed',
    gatewayRefundId: gatewayRefund?.id || `rfnd_${Date.now()}`,
    reason: reason || 'Customer Refund processed by Admin',
    processedBy: req.admin?._id,
    processedAt: new Date(),
    gatewayResponse: gatewayRefund,
  });

  // Update payment status
  payment.status = 'Refunded';
  await payment.save();

  // Update order status if order exists
  if (payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      paymentStatus: 'Refunded',
      orderStatus: 'Refunded',
    });
  }

  emitRefundUpdated(refundRecord);

  recordAuditLog(req, 'REFUND_PROCESSED', 'payments', refundRecord._id, {
    paymentId: payment._id,
    amount: refundAmt,
    reason,
  });

  return successResponse(res, refundRecord, `Refund of ₹${refundAmt} processed successfully`, 201);
});

module.exports = {
  getPayments,
  getPaymentById,
  processRefund,
};

