/**
 * Seller Authentication & Authorization Middleware
 * Supports Dual Access System: verifies JWT token and attaches req.seller
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Seller = require('../models/Seller');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Protect Seller Routes: verifies JWT token and attaches req.seller
 */
const protectSeller = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
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

    // Lookup seller by decoded.id
    let seller = await Seller.findById(decoded.id);

    // If not found directly, check if decoded.id is a User linked to a Seller by email
    if (!seller) {
      const user = await User.findById(decoded.id);
      if (user && user.email) {
        seller = await Seller.findOne({ email: user.email.toLowerCase().trim() });
      }
    }

    if (!seller) {
      return errorResponse(res, 'Seller account not found or has been removed.', 401);
    }

    if (seller.status === 'suspended' || seller.status === 'blocked' || !seller.isActive) {
      return errorResponse(
        res,
        'Your seller account has been suspended by the administrator. Contact platform support.',
        403,
        { sellerStatus: 'suspended' }
      );
    }

    if (seller.status === 'rejected') {
      return errorResponse(
        res,
        `Your seller application was rejected: ${seller.rejectionReason || 'Please contact support.'}`,
        403,
        { sellerStatus: 'rejected', rejectionReason: seller.rejectionReason }
      );
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
    pending: 'Your account is waiting for Admin approval.',
    pending_verification: 'Your account is waiting for Admin approval.',
    under_review: 'Your account is waiting for Admin approval.',
    rejected: `Your seller application was rejected: ${req.seller.rejectionReason || 'Please contact support.'}`,
    suspended: 'Your seller account has been suspended by the administrator. Contact platform support.',
    blocked: 'Your seller account has been blocked due to policy violations.',
  };

  const message = statusMessages[req.seller.status] || 'Your account is waiting for Admin approval.';
  return errorResponse(res, message, 403, { sellerStatus: req.seller.status });
};

module.exports = {
  protectSeller,
  requireApprovedSeller,
};
