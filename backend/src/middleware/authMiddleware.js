
/**
 * JWT Authentication and Role-Based Authorization Middleware
 * Supports Customer, Admin and Seller Dual Access.
 * Delivery authentication is handled separately.
 */

const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');

const User = require('../models/User');
const Seller = require('../models/Seller');

const { syncSellerToUser } = require('../utils/dualAccountBridge');

// Extract token from request
const getToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
};

// Main authentication middleware
const protect = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authentication required. No token provided.',
    });
  }

  let decoded;

  // Verify JWT
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  try {
    if (!decoded.id) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid authentication token.',
      });
    }

    // Delivery has its own authentication middleware
    if (decoded.role === 'delivery') {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Please use delivery authentication for this account.',
      });
    }

    // Find User account
    let user = await User.findById(decoded.id).select('-passwordHash');

    // Seller Dual Account Bridge
    if (!user && decoded.role === 'seller') {
      const seller = await Seller.findById(decoded.id);

      if (!seller) {
        return errorResponse(res, {
          statusCode: 401,
          message: 'Seller account not found. Please log in again.',
        });
      }

      if (!seller.isActive) {
        return errorResponse(res, {
          statusCode: 403,
          message: 'Your seller account is deactivated.',
        });
      }

      // Synchronize Seller with User account
      user = await syncSellerToUser(seller._id);

      if (!user) {
        return errorResponse(res, {
          statusCode: 500,
          message: 'Seller account synchronization failed. Please contact support.',
        });
      }

      req.seller = seller;
      req.isSeller = true;

      // Reload User without passwordHash
      user = await User.findById(user._id).select('-passwordHash');
    }

    // Check account existence
    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Check active status
    if (!user.isActive) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify token role matches database role
    if (decoded.role && decoded.role !== user.role) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Account role mismatch. Please log in again.',
      });
    }

    // Attach authenticated user
    req.user = user;

    // Attach Seller document for Seller APIs
    if (user.role === 'seller' || decoded.role === 'seller') {
      if (!req.seller) {
        req.seller = await Seller.findById(user._id);
      }

      if (req.seller) {
        req.isSeller = true;
      }
    }

    return next();

  } catch (error) {
    console.error('Authentication Middleware Error:', error);

    return errorResponse(res, {
      statusCode: 500,
      message: 'Authentication failed. Please try again.',
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role;

    // Sellers can also access customer-authorized routes
    const isAllowed =
      roles.includes(userRole) ||
      (
        roles.includes('customer') &&
        (userRole === 'seller' || req.isSeller)
      );

    if (!isAllowed) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Forbidden. Role '${userRole || 'guest'}' does not have permission to access this resource.`,
      });
    }

    return next();
  };
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded.id || decoded.role === 'delivery') {
      return next();
    }

    let user = await User.findById(decoded.id).select('-passwordHash');

    // Seller Dual Account Bridge
    if (!user && decoded.role === 'seller') {
      const seller = await Seller.findById(decoded.id);

      if (seller && seller.isActive) {
        user = await syncSellerToUser(seller._id);

        if (user) {
          req.seller = seller;
          req.isSeller = true;
          user = await User.findById(user._id).select('-passwordHash');
        }
      }
    }

    if (
      user &&
      user.isActive &&
      (!decoded.role || decoded.role === user.role)
    ) {
      req.user = user;

      if (user.role === 'seller' || decoded.role === 'seller') {
        if (!req.seller) {
          req.seller = await Seller.findById(user._id);
        }

        if (req.seller) {
          req.isSeller = true;
        }
      }
    }

  } catch (error) {
    // Optional authentication ignores invalid tokens.
    console.error('Optional Authentication Error:', error.message);
  }

  return next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
};
