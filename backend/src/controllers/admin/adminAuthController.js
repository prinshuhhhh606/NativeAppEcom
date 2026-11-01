const Admin = require('../../models/Admin');
const Role = require('../../models/Role');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/generateToken');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');

/**
 * Admin Login
 * POST /api/v1/admin/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return errorResponse(res, 'Please provide email and password', 400);
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!admin) {
    return errorResponse(res, 'Invalid admin credentials', 401);
  }

  if (!admin.isActive) {
    return errorResponse(res, 'This admin account is disabled. Contact Super Admin.', 403);
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 'Invalid admin credentials', 401);
  }

  const accessToken = generateAccessToken(admin._id, admin.role);
  const refreshToken = generateRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  // Log successful login audit
  recordAuditLog(
    { ...req, admin },
    'ADMIN_LOGIN',
    'auth',
    admin._id,
    { email: admin.email, role: admin.role }
  );

  return successResponse(
    res,
    {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin,
      },
      accessToken,
      refreshToken,
    },
    'Admin authenticated successfully'
  );
});

/**
 * Get Current Admin Profile
 * GET /api/v1/admin/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  return successResponse(res, { admin }, 'Admin profile retrieved');
});

/**
 * Update Admin Profile
 * PUT /api/v1/admin/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const admin = await Admin.findById(req.admin._id);

  if (name) admin.name = name.trim();
  if (phone) admin.phone = phone.trim();
  if (avatar) admin.avatar = avatar;

  await admin.save();

  recordAuditLog(req, 'PROFILE_UPDATED', 'auth', admin._id, { updatedFields: { name, phone } });

  return successResponse(res, { admin }, 'Profile updated successfully');
});

/**
 * Change Admin Password
 * PUT /api/v1/admin/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return errorResponse(res, 'New password must be at least 6 characters long', 400);
  }

  const admin = await Admin.findById(req.admin._id).select('+password');

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  admin.password = newPassword;
  await admin.save();

  recordAuditLog(req, 'PASSWORD_CHANGED', 'auth', admin._id);

  return successResponse(res, null, 'Password updated successfully');
});

/**
 * Refresh Token
 * POST /api/v1/admin/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingToken } = req.body;

  if (!incomingToken) {
    return errorResponse(res, 'Refresh token required', 400);
  }

  const decoded = verifyRefreshToken(incomingToken);
  if (!decoded) {
    return errorResponse(res, 'Invalid or expired session. Please login again.', 401);
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin || admin.refreshToken !== incomingToken) {
    return errorResponse(res, 'Session terminated. Please login again.', 401);
  }

  const newAccessToken = generateAccessToken(admin._id, admin.role);
  const newRefreshToken = generateRefreshToken(admin._id);

  admin.refreshToken = newRefreshToken;
  await admin.save({ validateBeforeSave: false });

  return successResponse(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Session refreshed'
  );
});

/**
 * Admin Logout
 * POST /api/v1/admin/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  if (req.admin) {
    req.admin.refreshToken = undefined;
    await req.admin.save({ validateBeforeSave: false });
    recordAuditLog(req, 'ADMIN_LOGOUT', 'auth', req.admin._id);
  }
  return successResponse(res, null, 'Logged out successfully');
});

/**
 * List Team Admins
 * GET /api/v1/admin/auth/admins
 */
const listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
  return successResponse(res, admins, 'Admin team list fetched');
});

/**
 * Create New Admin (Super Admin only)
 * POST /api/v1/admin/auth/admins
 */
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, permissions } = req.body;

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return errorResponse(res, 'An admin with this email already exists', 400);
  }

  const admin = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    phone,
    role: role || 'admin',
    permissions: permissions || [],
  });

  recordAuditLog(req, 'ADMIN_CREATED', 'auth', admin._id, { email: admin.email, role: admin.role });

  return successResponse(
    res,
    {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    },
    'Admin account created successfully',
    201
  );
});

/**
 * Update Admin Status / Role (Super Admin only)
 * PATCH /api/v1/admin/auth/admins/:id
 */
const updateAdmin = asyncHandler(async (req, res) => {
  const { role, permissions, isActive } = req.body;

  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    return errorResponse(res, 'Admin not found', 404);
  }

  if (role) admin.role = role;
  if (permissions) admin.permissions = permissions;
  if (typeof isActive === 'boolean') admin.isActive = isActive;

  await admin.save();

  recordAuditLog(req, 'ADMIN_UPDATED', 'auth', admin._id, { role, isActive });

  return successResponse(res, admin, 'Admin updated successfully');
});

/**
 * List System Roles
 * GET /api/v1/admin/auth/roles
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({ isActive: true });
  return successResponse(res, roles, 'Roles fetched successfully');
});

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  listAdmins,
  createAdmin,
  updateAdmin,
  getRoles,
};

