/**
 * Seller Authentication & Authorization Middleware
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Seller = require('../models/Seller');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Protect Seller Routes: verifies JWT token and attaches req.seller
 */
const protectSeller = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. No seller session token provided.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT.ACCESS_SECRET);
    } catch (jwtErr) {
      return errorResponse(res, 'Invalid or expired seller session token. Please log in again.', 401);
    }

    const seller = await Seller.findById(decoded.id);
    if (!seller) {
      return errorResponse(res, 'Seller account not found or has been removed.', 401);
    }

    if (!seller.isActive) {
      return errorResponse(res, 'Your seller account has been deactivated. Contact platform support.', 403);
    }

    req.seller = seller;
    next();
  } catch (err) {
    return errorResponse(res, 'Seller authentication failed: ' + err.message, 401);
  }
};

/**
 * Require Approved Seller Middleware
 * Blocks unapproved or suspended sellers from performing operations (adding products, updating inventory, receiving orders)
 */
const requireApprovedSeller = (req, res, next) => {
  if (!req.seller) {
    return errorResponse(res, 'Authentication required.', 401);
  }

  if (req.seller.status === 'approved') {
    return next();
  }

  const statusMessages = {
    pending_verification: 'Your account is pending verification. Please complete KYC and bank details.',
    under_review: 'Your seller verification is under review by the Bharat Bazaar Admin team.',
    rejected: `Your seller application was rejected: ${req.seller.rejectionReason || 'Please contact support.'}`,
    suspended: 'Your seller account is temporarily suspended. Contact platform administrator.',
    blocked: 'Your seller account has been blocked due to policy violations.',
  };

  const message = statusMessages[req.seller.status] || 'Your seller account is not authorized to perform this action.';
  return errorResponse(res, message, 403, { sellerStatus: req.seller.status });
};

module.exports = {
  protectSeller,
  requireApprovedSeller,
};

