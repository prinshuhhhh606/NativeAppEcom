const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');

const ADMIN_ROLES = [
  'super_admin',
  'admin',
  'manager',
  'inventory_manager',
  'order_manager',
  'support_manager',
];

/**
 * Protect Admin Routes: verify JWT, role, and attach req.admin
 */
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        token = match[1].trim();
      }
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // 1. Missing token -> 401
    if (!token) {
      return errorResponse(res, 'Authentication required: no admin token provided', 401);
    }

    // 2. Verify JWT signature & expiration
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 'Admin session token has expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid admin session token: ' + jwtErr.message, 401);
    }

    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Invalid admin token payload.', 401);
    }

    // 3. Role-based check: Customers and Sellers are blocked with 403 Forbidden
    if (decoded.role && !ADMIN_ROLES.includes(decoded.role)) {
      return errorResponse(
        res,
        `Access denied. Authenticated role [${decoded.role}] does not have admin permission.`,
        403
      );
    }

    // 4. Verify admin exists in database
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      // Check if user is a valid customer or seller attempting admin access
      const [isCustomer, isSeller] = await Promise.all([
        User.findById(decoded.id).select('_id').lean(),
        Seller.findById(decoded.id).select('_id').lean(),
      ]);

      if (isCustomer || isSeller) {
        return errorResponse(
          res,
          'Access denied. Authenticated user does not have admin permission.',
          403
        );
      }

      return errorResponse(res, 'Admin account not found.', 401);
    }

    // 5. Check if admin account is active
    if (!admin.isActive) {
      return errorResponse(res, 'Admin account has been deactivated.', 403);
    }

    // 6. Ensure admin document role is also valid
    if (!ADMIN_ROLES.includes(admin.role)) {
      return errorResponse(
        res,
        `Access denied. Role [${admin.role}] does not have admin permission.`,
        403
      );
    }

    req.admin = admin;
    next();
  } catch (err) {
    return errorResponse(res, 'Admin authentication failed: ' + err.message, 401);
  }
};

/**
 * Role-Based Access Control Middleware
 * Example: requireRole('super_admin', 'inventory_manager')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    // Super Admin has unrestricted access to everything
    if (req.admin.role === 'super_admin') {
      return next();
    }

    if (!roles.includes(req.admin.role)) {
      return errorResponse(
        res,
        `Access denied. Role [${req.admin.role}] does not have permission for this action.`,
        403
      );
    }

    next();
  };
};

/**
 * Permission-Based Access Control Middleware
 * Example: requirePermission('products:write', 'inventory:adjust')
 */
const requirePermission = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.admin) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (req.admin.role === 'super_admin') {
      return next();
    }

    const adminPerms = req.admin.permissions || [];
    const hasPermission = requiredPerms.some(
      (perm) => adminPerms.includes(perm) || adminPerms.includes('*') || adminPerms.includes(`${perm.split(':')[0]}:*`)
    );

    if (!hasPermission) {
      return errorResponse(
        res,
        `Access denied. Missing required permission [${requiredPerms.join(' or ')}].`,
        403
      );
    }

    next();
  };
};

/**
 * Helper to record audit log
 */
const recordAuditLog = async (req, action, module, targetId = null, details = {}) => {
  try {
    if (!req.admin || mongoose.connection.readyState !== 1) return;
    await AuditLog.create({
      admin: req.admin._id,
      adminName: req.admin.name,
      adminEmail: req.admin.email,
      action,
      module,
      targetId: targetId ? targetId.toString() : null,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      userAgent: req.headers?.['user-agent'] || req.headers?.['User-Agent'] || '',
    });
  } catch (e) {
    console.warn('Failed to record audit log:', e.message);
  }
};

module.exports = {
  protectAdmin,
  requireRole,
  requirePermission,
  recordAuditLog,
};

