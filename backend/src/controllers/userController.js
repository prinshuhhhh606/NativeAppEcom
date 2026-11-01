const User = require('../models/User');
const Order = require('../models/Order');
const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * Get current user profile with summary stats
 * GET /api/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const [ordersCount, addressesCount] = await Promise.all([
    Order.countDocuments({ user: user._id }),
    Address.countDocuments({ user: user._id }),
  ]);

  return successResponse(res, {
    user,
    stats: {
      totalOrders: ordersCount,
      savedAddresses: addressesCount,
    },
  }, 'Profile retrieved successfully');
});

/**
 * Update user profile details
 * PUT /api/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, email } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  if (name) user.name = name.trim();
  if (email && email.trim().toLowerCase() !== user.email) {
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: user._id },
    });
    if (existingEmail) {
      return errorResponse(res, 'Email is already associated with another account', 400);
    }
    user.email = email.trim().toLowerCase();
  }
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
    if (existingPhone) {
      return errorResponse(res, 'Phone number is already associated with another account', 400);
    }
    user.phone = phone;
    user.isPhoneVerified = false;
  }

  await user.save();

  return successResponse(res, { user }, 'Profile updated successfully');
});

/**
 * Update user avatar
 * POST /api/users/avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'Please upload an image file', 400);
  }

  const uploadResult = await cloudinaryService.uploadImage(req.file, 'avatars');
  const user = await User.findById(req.user._id);

  user.avatar = uploadResult.url;
  await user.save();

  return successResponse(res, { avatar: user.avatar }, 'Avatar updated successfully');
});

/**
 * Change password
 * PUT /api/users/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 'Current password does not match', 400);
  }

  user.password = newPassword;
  await user.save();

  return successResponse(res, null, 'Password changed successfully');
});

/**
 * [Admin] Get all users with pagination and search
 * GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const search = req.query.search || '';
  const role = req.query.role;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return successResponse(
    res,
    users,
    'Users list fetched',
    200,
    {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  );
});

/**
 * [Admin] Update user role or active status
 * PATCH /api/users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await user.save();

  return successResponse(res, { user }, 'User status updated successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getAllUsers,
  updateUserStatus,
};

