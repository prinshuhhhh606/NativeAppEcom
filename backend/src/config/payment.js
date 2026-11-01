/**
 * Razorpay Payment Gateway Client Configuration
 */
const Razorpay = require('razorpay');
const env = require('./env');

let razorpayInstance = null;

try {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY.KEY_ID,
    key_secret: env.RAZORPAY.KEY_SECRET,
  });
} catch (e) {
  console.warn('[Razorpay] Client initialization deferred:', e.message);
}

module.exports = razorpayInstance;

