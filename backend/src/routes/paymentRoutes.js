const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimitMiddleware');

// Webhook is called by Razorpay servers directly
router.post('/razorpay/webhook', paymentController.handleWebhook);

// Protected client endpoints
router.post('/razorpay/order', protect, paymentLimiter, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', protect, paymentLimiter, paymentController.verifyPayment);
router.get('/status/:orderId', protect, paymentController.getPaymentStatus);

module.exports = router;

