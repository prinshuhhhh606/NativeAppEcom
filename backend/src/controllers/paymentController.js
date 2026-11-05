const Payment = require('../models/Payment');
const Order = require('../models/Order');
const SellerOrder = require('../models/SellerOrder');
const Refund = require('../models/Refund');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');
const { emitOrderStatusUpdated } = require('../sockets/socketManager');
const { syncParentOrderStatus } = require('../utils/orderSync');

const markOrderConfirmedAfterPayment = async (order) => {
  if (!order) return order;

  const normalizedStatus = (order.orderStatus || '').toLowerCase();
  const shouldConfirm = ['pending', 'placed', 'new', 'created', ''].includes(normalizedStatus);

  if (shouldConfirm) {
    order.orderStatus = 'confirmed';
    order.confirmedAt = order.confirmedAt || new Date();
  }

  await order.save();

  await SellerOrder.updateMany(
    {
      order: order._id,
      status: { $in: ['pending', 'new', 'placed', ''] },
    },
    {
      $set: {
        status: 'confirmed',
        acceptedAt: new Date(),
      },
    }
  );

  try {
    await syncParentOrderStatus(order._id);
  } catch (syncErr) {
    console.warn('[Payment Confirm] Parent order sync failed:', syncErr?.message);
  }

  emitOrderStatusUpdated(order);

  return order;
};

/**
 * Initialize Razorpay Order
 * POST /api/payments/razorpay/order
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({
    $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }],
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const razorpayOrder = await paymentService.createRazorpayOrder({
    amount: order.pricing.grandTotal,
    receipt: order.orderId,
    notes: {
      orderId: order.orderId,
      userId: req.user._id.toString(),
    },
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return successResponse(
    res,
    {
      orderId: order.orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    },
    'Razorpay order created successfully'
  );
});

/**
 * Verify Razorpay payment signature
 * POST /api/payments/razorpay/verify
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return errorResponse(res, 'Missing required payment verification details', 400);
  }

  const isValid = paymentService.verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    return errorResponse(res, 'Invalid payment signature. Payment verification failed.', 400);
  }

  // Find order by razorpay_order_id or internal orderId
  const order = await Order.findOne({
    $or: [
      { razorpayOrderId: razorpay_order_id },
      ...(orderId ? [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }] : []),
    ],
  });

  if (!order) {
    return errorResponse(res, 'Associated order not found', 404);
  }

  // Update order status after successful payment
  order.paymentStatus = 'Paid';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.paidAt = new Date();
  await markOrderConfirmedAfterPayment(order);

  // Record payment in Payment ledger
  const paymentRecord = await Payment.create({
    order: order._id,
    user: order.user,
    paymentMethod: 'Razorpay',
    amount: order.pricing.grandTotal,
    currency: 'INR',
    status: 'Captured',
    transactionId: razorpay_payment_id,
    gatewayResponse: {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    },
  });

  return successResponse(
    res,
    {
      orderId: order.orderId,
      paymentId: paymentRecord._id,
      status: 'Paid',
    },
    'Payment verified and completed successfully'
  );
});

/**
 * Razorpay Webhook Handler
 * POST /api/payments/razorpay/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Webhook signature verification if secret is configured
  if (webhookSecret && webhookSignature) {
    const isValid = paymentService.verifyWebhookSignature(req.body, webhookSignature, webhookSecret);
    if (!isValid) {
      console.warn('[Payment Webhook] Invalid webhook signature detected!');
      return res.status(400).json({ status: 'invalid_signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[Payment Webhook] Verified event: ${event}`);

  if (event === 'payment.captured') {
    const paymentEntity = payload.payment?.entity || {};
    const razorpayOrderId = paymentEntity.order_id;

    const order = await Order.findOne({ razorpayOrderId });
    if (order && order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
      order.paidAt = new Date();
      order.razorpayPaymentId = paymentEntity.id;
      await markOrderConfirmedAfterPayment(order);

      // Synchronize SellerOrder
      await SellerOrder.updateMany(
        { order: order._id },
        { $set: { paymentStatus: 'Completed' } }
      );

      // Record in Payment ledger if not already recorded
      const existingPay = await Payment.findOne({ transactionId: paymentEntity.id });
      if (!existingPay) {
        await Payment.create({
          order: order._id,
          user: order.user,
          paymentMethod: 'Razorpay',
          amount: (paymentEntity.amount || 0) / 100,
          currency: paymentEntity.currency || 'INR',
          status: 'Captured',
          transactionId: paymentEntity.id,
          gatewayResponse: paymentEntity,
        });
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = payload.payment?.entity || {};
    const razorpayOrderId = paymentEntity.order_id;

    const order = await Order.findOne({ razorpayOrderId });
    if (order && order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Failed';
      await order.save();
    }
  } else if (event === 'refund.processed') {
    const refundEntity = payload.refund?.entity || {};
    const paymentId = refundEntity.payment_id;

    await Refund.findOneAndUpdate(
      { $or: [{ gatewayRefundId: refundEntity.id }, { gatewayResponse: { payment_id: paymentId } }] },
      { $set: { status: 'Processed', processedAt: new Date(), gatewayRefundId: refundEntity.id } }
    );
  }

  return res.status(200).json({ status: 'ok', received: true });
});

/**
 * Get payment status for order
 * GET /api/payments/status/:orderId
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    $or: [{ orderId: req.params.orderId }, { _id: req.params.orderId.match(/^[0-9a-fA-F]{24}$/) ? req.params.orderId : null }],
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const payment = await Payment.findOne({ order: order._id });

  return successResponse(
    res,
    {
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      grandTotal: order.pricing.grandTotal,
      transactionId: payment?.transactionId,
    },
    'Payment status retrieved'
  );
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
};

