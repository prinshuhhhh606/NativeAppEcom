const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const handler = (message) => (req, res /*, next, options */) => {
  return errorResponse(res, message, 429);
};

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.RATE_LIMIT_MAX || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many requests from this IP, please try again later.'),
});

// Strict rate limiter for authentication routes (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many authentication attempts. Please try again after 15 minutes.'),
});

// Sensitive payment routes limiter
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many payment operations. Please try again shortly.'),
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
};

