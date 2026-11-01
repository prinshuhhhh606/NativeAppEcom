const Admin = require('../models/Admin');
const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');

/**
 * Protect Admin Routes: verify JWT and attach req.admin
 */
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. No admin token provided.', 401);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return errorResponse(res, 'Invalid or expired admin session token.', 401);
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return errorResponse(res, 'Admin account not found.', 401);
    }

    if (!admin.isActive) {
      return errorResponse(res, 'Admin account has been deactivated.', 403);
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
    if (!req.admin) return;
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

