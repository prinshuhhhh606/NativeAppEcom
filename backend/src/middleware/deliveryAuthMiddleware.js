
/**
 * Delivery Partner Authentication Middleware
 * Protects all Delivery Partner APIs.
 */

const DeliveryPartner = require('../models/DeliveryPartner');
const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');

const protectDelivery = async (req, res, next) => {
  try {
    // 1. Get Bearer Token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'Authentication required. Please log in as a delivery partner.',
        401
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(
        res,
        'Invalid authentication token.',
        401
      );
    }

    // 2. Verify JWT Token
    const decoded = verifyAccessToken(token);

    // 3. Check Delivery Role
    if (decoded.role !== 'delivery') {
      return errorResponse(
        res,
        'Forbidden. Please log in with a delivery partner account.',
        403
      );
    }

    if (!decoded.id) {
      return errorResponse(
        res,
        'Invalid delivery authentication token.',
        401
      );
    }

    // 4. Find Delivery Partner
    const partner = await DeliveryPartner.findById(decoded.id);

    if (!partner) {
      return errorResponse(
        res,
        'Delivery partner account not found. Please log in again.',
        401
      );
    }

    // 5. Check Account Active Status
    if (partner.isActive !== true) {
      return errorResponse(
        res,
        'Your delivery partner account is deactivated.',
        403
      );
    }

    // 6. Attach Partner to Request
    req.deliveryPartner = partner;

    return next();

  } catch (error) {
    console.error(
      'Delivery Authentication Error:',
      error.message
    );

    return errorResponse(
      res,
      'Invalid or expired session. Please log in again.',
      401
    );
  }
};

/**
 * Middleware: Require Approved KYC Status
 * Blocks unapproved/pending/rejected delivery partners from operational routes.
 */
const requireApprovedDelivery = async (req, res, next) => {
  try {
    if (!req.deliveryPartner) {
      return errorResponse(
        res,
        'Authentication required. Please log in as a delivery partner.',
        401
      );
    }

    if (req.deliveryPartner.kycStatus !== 'approved') {
      const isRejected = req.deliveryPartner.kycStatus === 'rejected';
      const msg = isRejected
        ? `Your account was rejected by Admin: ${req.deliveryPartner.adminRemarks || 'Document verification criteria not met'}.`
        : 'Your account is pending Admin approval. You will be able to access your Delivery Dashboard after approval.';

      return errorResponse(
        res,
        msg,
        403,
        {
          kycStatus: req.deliveryPartner.kycStatus,
          requiresApproval: true,
          adminRemarks: req.deliveryPartner.adminRemarks || '',
        }
      );
    }

    return next();
  } catch (err) {
    return errorResponse(res, 'Internal authorization error.', 500);
  }
};

module.exports = {
  protectDelivery,
  requireApprovedDelivery,
};

