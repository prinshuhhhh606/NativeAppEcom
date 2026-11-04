/**
 * JWT Authentication and Role-Based Authorization Middleware
 * Includes Dual Access System support for Sellers shopping as Customers.
 */
const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { syncSellerToUser } = require('../utils/dualAccountBridge');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authentication required. No token provided.',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    let user = await User.findById(decoded.id).select('-passwordHash');

    // Dual Access Bridge: If token belongs to a Seller, ensure User record exists
    if (!user) {
      const seller = await Seller.findById(decoded.id);
      if (seller) {
        user = await syncSellerToUser(seller);
        if (user) {
          req.seller = seller;
          req.isSeller = true;
        }
      }
    } else if (user.role === 'seller' || decoded.role === 'seller') {
      const seller = await Seller.findById(user._id);
      if (seller) {
        req.seller = seller;
        req.isSeller = true;
      }
    }

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Forbidden. No authenticated user identity found.',
      });
    }

    const userRole = req.user.role;
    // Dual Access: A seller has full customer permissions
    const isAllowed =
      roles.includes(userRole) ||
      (roles.includes('customer') && (userRole === 'seller' || req.isSeller));

    if (!isAllowed) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Forbidden. Role '${userRole || 'guest'}' does not have permission to access this resource.`,
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    let user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      const seller = await Seller.findById(decoded.id);
      if (seller) {
        user = await syncSellerToUser(seller);
        if (user) {
          req.seller = seller;
          req.isSeller = true;
        }
      }
    }
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (e) {
    // Ignore invalid optional tokens
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
};
