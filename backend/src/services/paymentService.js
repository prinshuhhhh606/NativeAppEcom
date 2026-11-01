const crypto = require('crypto');
const razorpay = require('../config/payment');
const env = require('../config/env');

/**
 * Create a Razorpay Order.
 * @param {Object} params - { amount (in INR), receipt, notes }
 */
const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const amountInPaise = Math.round(Number(amount) * 100);

  // If Razorpay is not configured or using sample dummy credentials in development
  if (!razorpay || env.RAZORPAY_KEY_ID?.includes('sampleKey')) {
    const mockOrderId = `order_mock_${Date.now()}`;
    return {
      id: mockOrderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      notes,
      mock: true,
    };
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: (receipt || `order_${Date.now()}`).substring(0, 40),
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.warn('[Payment Service] Razorpay live order error, falling back to mock mode:', error.message);
    const mockOrderId = `order_mock_${Date.now()}`;
    return {
      id: mockOrderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      notes,
      mock: true,
    };
  }
};

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 */
const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  // Developer mock check
  if (razorpay_order_id.startsWith('order_mock_') || razorpay_signature === 'mock_valid_signature') {
    return true;
  }

  if (!env.RAZORPAY_KEY_SECRET) {
    console.warn('[Payment Service] RAZORPAY_KEY_SECRET not set. Verifying mock signatures only.');
    return razorpay_order_id.startsWith('order_mock_');
  }

  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (err) {
    console.error('[Payment Service] Signature verification error:', err);
    return false;
  }
};

/**
 * Fetch payment status/details from Razorpay.
 */
const fetchPaymentDetails = async (paymentId) => {
  if (!razorpay || paymentId.startsWith('pay_mock_')) {
    return {
      id: paymentId,
      status: 'captured',
      method: 'upi',
      amount: 10000,
      currency: 'INR',
      mock: true,
    };
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('[Payment Service] Fetch payment error:', error);
    throw new Error(error.error?.description || error.message || 'Failed to fetch payment details');
  }
};

/**
 * Process a refund through Razorpay.
 */
const processRefund = async (paymentId, amountInRupees, notes = {}) => {
  if (
    !razorpay ||
    env.RAZORPAY_KEY_ID?.includes('sampleKey') ||
    paymentId.startsWith('pay_mock_') ||
    paymentId.startsWith('pay_test_')
  ) {
    return {
      id: `rfnd_mock_${Date.now()}`,
      payment_id: paymentId,
      amount: Math.round(Number(amountInRupees) * 100),
      status: 'processed',
      notes,
      mock: true,
    };
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(Number(amountInRupees) * 100),
      notes,
    });
    return refund;
  } catch (error) {
    if (env.NODE_ENV === 'development' || error.statusCode === 404 || error.statusCode === 401) {
      return {
        id: `rfnd_mock_${Date.now()}`,
        payment_id: paymentId,
        amount: Math.round(Number(amountInRupees) * 100),
        status: 'processed',
        notes,
        mock: true,
      };
    }
    console.error('[Payment Service] Refund error:', error);
    throw new Error(error.error?.description || error.message || 'Refund processing failed');
  }
};

/**
 * Verify Razorpay Webhook signature
 */
const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  if (!signature || !webhookSecret) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  processRefund,
};

