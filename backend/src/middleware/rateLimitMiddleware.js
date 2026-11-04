const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const handler = (message) => (req, res /*, next, options */) => {
  return errorResponse(res, message, 429);
};

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 5000 : (env.RATE_LIMIT_MAX || 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  handler: handler('Too many requests from this IP. Please wait a moment before trying again.'),
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

// Dedicated rate limiter for product submissions to prevent duplicate/spam reviews
const productSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 500 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    // Key by authenticated seller ID so other sellers/IPs on same network are not affected
    return req.seller?._id ? `seller_${req.seller._id}` : req.ip;
  },
  handler: handler('Too many product submission attempts. Please wait a few minutes before trying again.'),
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  productSubmissionLimiter,
};

