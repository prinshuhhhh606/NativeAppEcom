const User = require('../models/User');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { syncSellerToUser, findAssociatedSeller } = require('../utils/dualAccountBridge');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { emitCustomerRegistered } = require('../sockets/socketManager');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  // 1. Extract and normalize fields (supporting both canonical and alias keys)
  const fullName = (req.body.fullName || req.body.name || '').toString().trim();
  const rawMobile = req.body.mobileNumber || req.body.phone || '';
  const mobileNumber = rawMobile ? rawMobile.toString().trim().replace(/[^0-9]/g, '') : '';
  const email = (req.body.email || '').toString().trim().toLowerCase();
  const password = req.body.password;

  // 2. Explicit server validation checks
  if (!fullName || fullName.length < 2) {
    return errorResponse(res, 'Full name is required and must be at least 2 characters', 400);
  }

  if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
    return errorResponse(res, 'Please provide a valid 10-digit Indian mobile number', 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse(res, 'Please provide a valid email address', 400);
  }

  if (!password || password.length < 6) {
    return errorResponse(res, 'Password is required and must be at least 6 characters long', 400);
  }

  // 3. Check for duplicates in MongoDB (both email and mobileNumber)
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return errorResponse(res, 'Email address is already registered. Please log in.', 400);
  }

  const existingMobile = await User.findOne({
    $or: [{ mobileNumber }, { phone: mobileNumber }],
  });
  if (existingMobile) {
    return errorResponse(res, 'Mobile number is already registered. Please log in.', 400);
  }

  // 4. Securely hash password using bcrypt
  const passwordHash = await User.hashPassword(password);

  // 5. Create user in MongoDB with canonical Mongoose schema fields
  const user = await User.create({
    fullName,
    mobileNumber,
    email,
    passwordHash,
    role: 'customer',
    isActive: true,
    isVerified: false,
  });

  // 6. Initialize cart and wishlist for user
  await Promise.all([
    Cart.create({ user: user._id, items: [] }),
    Wishlist.create({ user: user._id, products: [] }),
  ]);

  // 7. Generate tokens and persist session
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  // 8. Non-blocking welcome email & real-time notification
  emailService.sendWelcomeEmail(user).catch((err) => console.error('Welcome email error:', err.message));
  emitCustomerRegistered(user);

  // 9. Standardized success response with both canonical and alias fields
  return successResponse(
    res,
    {
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        avatar: user.profileImage,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isPhoneVerified: user.isVerified,
        isEmailVerified: user.isVerified,
      },
      accessToken,
      token: accessToken,
      refreshToken,
    },
    'User registered successfully',
    201
  );
});

/**
 * Login with email or phone + password
 * POST /api/auth/login
 * Supports Dual Access: Customers and Sellers can both log in seamlessly
 */
const login = asyncHandler(async (req, res) => {
  const { email, phone, mobileNumber, identifier, password } = req.body;
  const loginKey = (identifier || email || mobileNumber || phone || '').toString().trim();

  if (!loginKey) {
    return errorResponse(res, 'Please provide an email or mobile number to log in', 400);
  }

  if (!password) {
    return errorResponse(res, 'Password is required', 400);
  }

  // Determine lookup conditions
  const searchConditions = [];
  const sellerSearch = [];
  if (loginKey.includes('@')) {
    searchConditions.push({ email: loginKey.toLowerCase() });
    sellerSearch.push({ email: loginKey.toLowerCase() });
  } else {
    const cleanedDigits = loginKey.replace(/[^0-9]/g, '');
    if (cleanedDigits) {
      searchConditions.push({ mobileNumber: cleanedDigits });
      searchConditions.push({ phone: cleanedDigits });
      sellerSearch.push({ phone: cleanedDigits });
    }
    searchConditions.push({ email: loginKey.toLowerCase() });
    sellerSearch.push({ email: loginKey.toLowerCase() });
  }

  let user = await User.findOne({ $or: searchConditions }).select('+passwordHash');
  let seller = null;

  if (user) {
    if (!user.isActive) {
      return errorResponse(res, 'Your account is currently disabled. Please contact support.', 403);
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      // Also check if password matches associated seller account
      seller = await findAssociatedSeller(user);
      let sellerMatch = false;
      if (seller) {
        const fullSeller = await Seller.findById(seller._id).select('+password');
        if (fullSeller && (await fullSeller.comparePassword(password))) {
          sellerMatch = true;
          user.passwordHash = fullSeller.password;
          await user.save({ validateBeforeSave: false });
        }
      }
      if (!sellerMatch) {
        return errorResponse(res, 'Invalid email/phone or password', 401);
      }
    } else {
      seller = await findAssociatedSeller(user);
    }
  } else {
    // Check if this credential belongs to a Seller in Seller collection
    const sellerCandidate = await Seller.findOne({ $or: sellerSearch }).select('+password');
    if (!sellerCandidate) {
      return errorResponse(res, 'Invalid email/phone or password', 401);
    }
    if (!sellerCandidate.isActive) {
      return errorResponse(res, 'Your seller account has been deactivated. Please contact support.', 403);
    }
    const isSellerPasswordMatch = await sellerCandidate.comparePassword(password);
    if (!isSellerPasswordMatch) {
      return errorResponse(res, 'Invalid email/phone or password', 401);
    }
    seller = sellerCandidate;
    user = await syncSellerToUser(seller);
  }

  const role = seller ? 'seller' : (user?.role || 'customer');
  const accessToken = generateAccessToken(user._id, role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  if (seller) {
    seller.lastLogin = new Date();
    seller.refreshToken = refreshToken;
    await seller.save({ validateBeforeSave: false });
  }

  return successResponse(
    res,
    {
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName || (seller ? seller.name : ''),
        name: user.fullName || (seller ? seller.name : ''),
        mobileNumber: user.mobileNumber || (seller ? seller.phone : ''),
        phone: user.mobileNumber || (seller ? seller.phone : ''),
        email: user.email || (seller ? seller.email : ''),
        role,
        profileImage: user.profileImage || (seller ? seller.avatar : ''),
        avatar: user.profileImage || (seller ? seller.avatar : ''),
        isActive: user.isActive,
        isVerified: user.isVerified || (seller ? seller.isVerified || seller.status === 'approved' : false),
        isPhoneVerified: user.isVerified,
        isEmailVerified: user.isVerified,
        // Dual Access System fields
        isSeller: !!seller,
        sellerId: seller ? seller._id : null,
        sellerStatus: seller ? seller.status : null,
        storeName: seller ? (seller.storeName || seller.businessName) : null,
        canSell: !!seller,
        canShop: true,
      },
      accessToken,
      token: accessToken,
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
  const rawMobile = req.body.phone || req.body.mobileNumber || '';
  const phone = rawMobile.toString().trim().replace(/[^0-9]/g, '');

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return errorResponse(res, 'Please enter a valid 10-digit Indian mobile number', 400);
  }

  const otp = otpService.generateOTP(6);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user = await User.findOne({
    $or: [{ mobileNumber: phone }, { phone }],
  });

  if (user) {
    user.otp = otp;
    user.otpExpiry = otpExpires;
    await user.save({ validateBeforeSave: false });
  } else {
    // If user does not exist yet, save a temp placeholder with required schema fields
    user = await User.create({
      fullName: `User-${phone.slice(-4)}`,
      mobileNumber: phone,
      email: `${phone}@appecom.placeholder`,
      otp,
      otpExpiry,
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
      mobileNumber: phone,
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
  const rawMobile = req.body.phone || req.body.mobileNumber || '';
  const phone = rawMobile.toString().trim().replace(/[^0-9]/g, '');
  const { otp } = req.body;

  const user = await User.findOne({
    $or: [{ mobileNumber: phone }, { phone }],
  }).select('+otp +otpExpiry');

  if (!user || !user.otp) {
    return errorResponse(res, 'No OTP requested for this phone number', 400);
  }

  const verification = otpService.verifyOTP(user.otp, user.otpExpiry, otp);
  if (!verification.isValid) {
    return errorResponse(res, verification.reason, 400);
  }

  // Clear OTP and mark verified
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isVerified = true;
  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken });

  await user.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        avatar: user.profileImage,
        isVerified: user.isVerified,
        isPhoneVerified: user.isVerified,
        isEmailVerified: user.isVerified,
      },
      accessToken,
      token: accessToken,
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

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    return errorResponse(res, 'Invalid or expired refresh token. Please log in again.', 401);
  }

  if (!decoded || !decoded.id) {
    return errorResponse(res, 'Invalid or expired refresh token. Please log in again.', 401);
  }

  let user = await User.findById(decoded.id).select('+refreshToken +previousRefreshToken');
  let seller = null;

  // Dual Access System: Support seller tokens and linked accounts
  if (!user || user.refreshToken !== incomingToken) {
    seller = await Seller.findById(decoded.id).select('+refreshToken +previousRefreshToken');
    if (!seller && user && user.email) {
      seller = await Seller.findOne({ email: user.email.toLowerCase().trim() }).select('+refreshToken +previousRefreshToken');
    }
  }

  const isUserMatch =
    user &&
    (user.refreshToken === incomingToken ||
      (user.previousRefreshToken === incomingToken &&
        user.previousRefreshTokenExpires &&
        new Date() < new Date(user.previousRefreshTokenExpires)));

  const isSellerMatch =
    seller &&
    (seller.refreshToken === incomingToken ||
      (seller.previousRefreshToken === incomingToken &&
        seller.previousRefreshTokenExpires &&
        new Date() < new Date(seller.previousRefreshTokenExpires)));

  if (!isUserMatch && !isSellerMatch) {
    return errorResponse(res, 'Invalid refresh token session. Please log in again.', 401);
  }

  const targetId = user ? user._id : seller._id;
  const targetRole = seller ? 'seller' : (user?.role || 'customer');
  const newAccessToken = generateAccessToken(targetId, targetRole);
  const newRefreshToken = generateRefreshToken(targetId);

  if (user) {
    user.previousRefreshToken = user.refreshToken;
    user.previousRefreshTokenExpires = new Date(Date.now() + 60 * 1000);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
  }

  if (seller) {
    seller.previousRefreshToken = seller.refreshToken;
    seller.previousRefreshTokenExpires = new Date(Date.now() + 60 * 1000);
    seller.refreshToken = newRefreshToken;
    await seller.save({ validateBeforeSave: false });
  }

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

