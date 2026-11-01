const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { emitCustomerRegistered } = require('../sockets/socketManager');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
  });

  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Phone number';
    return errorResponse(res, `${field} is already registered. Please log in.`, 400);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
  });

  // Initialize cart and wishlist for user
  await Promise.all([
    Cart.create({ user: user._id, items: [] }),
    Wishlist.create({ user: user._id, products: [] }),
  ]);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Send non-blocking welcome email & emit real-time event
  emailService.sendWelcomeEmail(user).catch((err) => console.error('Welcome email error:', err.message));
  emitCustomerRegistered(user);

  return successResponse(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    },
    'User registered successfully',
    201
  );
});

/**
 * Login with email or phone + password
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, phone, identifier, password } = req.body;
  const loginKey = identifier || email || phone;

  const user = await User.findOne({
    $or: [
      { email: loginKey.toLowerCase() },
      { phone: loginKey },
    ],
  }).select('+password');

  if (!user) {
    return errorResponse(res, 'Invalid email/phone or password', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Your account is currently disabled. Please contact support.', 403);
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return errorResponse(res, 'Invalid email/phone or password', 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    },
    'Login successful'
  );
});

/**
 * Send OTP for mobile number login/registration
 * POST /api/auth/send-otp
 */
const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const otp = otpService.generateOTP(6);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user = await User.findOne({ phone });

  if (user) {
    user.otp = { code: otp, expiresAt: otpExpires };
    await user.save({ validateBeforeSave: false });
  } else {
    // If user does not exist yet, save a temp placeholder or record OTP
    user = await User.create({
      name: `User-${phone.slice(-4)}`,
      email: `${phone}@appecom.placeholder`,
      phone,
      otp: { code: otp, expiresAt: otpExpires },
    });
    // Create cart and wishlist
    await Promise.all([
      Cart.create({ user: user._id, items: [] }),
      Wishlist.create({ user: user._id, products: [] }),
    ]);
  }

  const result = await otpService.sendOTP(phone, otp);

  return successResponse(
    res,
    {
      phone,
      expiresInMinutes: 10,
      debugOtp: result.debugOtp,
    },
    'OTP sent successfully'
  );
});

/**
 * Verify OTP and login/register
 * POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !user.otp?.code) {
    return errorResponse(res, 'No OTP requested for this phone number', 400);
  }

  const verification = otpService.verifyOTP(user.otp.code, user.otp.expiresAt, otp);
  if (!verification.isValid) {
    return errorResponse(res, verification.reason, 400);
  }

  // Clear OTP and mark verified
  user.otp = undefined;
  user.isPhoneVerified = true;
  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isPhoneVerified: user.isPhoneVerified,
      },
      accessToken,
      refreshToken,
    },
    'Phone number verified successfully'
  );
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingToken } = req.body;

  if (!incomingToken) {
    return errorResponse(res, 'Refresh token is required', 400);
  }

  const decoded = verifyRefreshToken(incomingToken);
  if (!decoded) {
    return errorResponse(res, 'Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== incomingToken) {
    return errorResponse(res, 'Invalid refresh token session', 401);
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
    'Token refreshed successfully'
  );
});

/**
 * Forgot password request
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // For security, do not leak whether the email is registered
    return successResponse(res, null, 'If this email is registered, a password reset code has been sent.');
  }

  const otp = otpService.generateOTP(6);
  user.resetPasswordOtp = otp;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await emailService.sendPasswordResetEmail(user, otp);

  return successResponse(res, null, 'If this email is registered, a password reset code has been sent.');
});

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user || user.resetPasswordOtp !== otp.trim()) {
    return errorResponse(res, 'Invalid or expired reset code', 400);
  }

  user.password = newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return successResponse(res, null, 'Password reset successful. You can now log in with your new password.');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
  }

  return successResponse(res, null, 'Logged out successfully');
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, { user: req.user }, 'Current user profile fetched');
});

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
};

