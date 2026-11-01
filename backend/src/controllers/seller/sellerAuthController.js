/**
 * Seller Authentication Controller
 */
const Seller = require('../../models/Seller');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/generateToken');
const crypto = require('crypto');

/**
 * Register New Seller
 * POST /api/v1/seller/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    businessName,
    businessType = 'proprietorship',
    storeName,
    street,
    city = 'Jaipur',
    state = 'Rajasthan',
    pinCode = '302001',
  } = req.body || {};

  if (!name || !email || !password || !phone || !businessName) {
    return errorResponse(res, 'Please provide all required fields: name, email, password, phone, and business name.', 400);
  }

  const existingEmail = await Seller.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    return errorResponse(res, 'A seller account with this email already exists.', 409);
  }

  const cleanStoreName = storeName || businessName;
  const storeSlug = cleanStoreName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  const seller = await Seller.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone.trim(),
    businessName: businessName.trim(),
    businessType,
    storeName: cleanStoreName,
    storeSlug,
    address: {
      street: street || '',
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      country: 'India',
    },
    status: 'pending_verification',
  });

  const accessToken = generateAccessToken(seller._id, 'seller');
  const refreshToken = generateRefreshToken(seller._id);

  seller.refreshToken = refreshToken;
  seller.lastLogin = new Date();
  await seller.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        businessName: seller.businessName,
        businessType: seller.businessType,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        status: seller.status,
        address: seller.address,
        balance: seller.balance,
      },
      accessToken,
      refreshToken,
    },
    'Seller registered successfully! Please complete KYC verification.',
    201
  );
});

/**
 * Seller Login
 * POST /api/v1/seller/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return errorResponse(res, 'Please enter email and password', 400);
  }

  const seller = await Seller.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!seller) {
    return errorResponse(res, 'Invalid seller email or password', 401);
  }

  if (!seller.isActive) {
    return errorResponse(res, 'Your seller account has been deactivated. Please contact support.', 403);
  }

  const isMatch = await seller.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 'Invalid seller email or password', 401);
  }

  const accessToken = generateAccessToken(seller._id, 'seller');
  const refreshToken = generateRefreshToken(seller._id);

  seller.refreshToken = refreshToken;
  seller.lastLogin = new Date();
  await seller.save({ validateBeforeSave: false });

  return successResponse(
    res,
    {
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        avatar: seller.avatar,
        businessName: seller.businessName,
        businessType: seller.businessType,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        status: seller.status,
        rejectionReason: seller.rejectionReason,
        address: seller.address,
        panNumber: seller.panNumber,
        gstin: seller.gstin,
        bankAccount: {
          accountHolderName: seller.bankAccount?.accountHolderName,
          accountNumber: seller.bankAccount?.accountNumber ? '••••' + seller.bankAccount.accountNumber.slice(-4) : '',
          ifscCode: seller.bankAccount?.ifscCode,
          bankName: seller.bankAccount?.bankName,
          isVerified: seller.bankAccount?.isVerified,
        },
        balance: seller.balance,
        commissionRate: seller.commissionRate,
      },
      accessToken,
      refreshToken,
    },
    'Login successful'
  );
});

/**
 * Refresh Access Token
 * POST /api/v1/seller/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken = req.body?.refreshToken;
  if (!incomingToken) {
    return errorResponse(res, 'Refresh token is required', 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    return errorResponse(res, 'Invalid or expired session. Please login again.', 401);
  }

  const seller = await Seller.findById(decoded.id).select('+refreshToken');
  if (!seller || seller.refreshToken !== incomingToken) {
    return errorResponse(res, 'Session terminated. Please login again.', 401);
  }

  const newAccessToken = generateAccessToken(seller._id, 'seller');
  const newRefreshToken = generateRefreshToken(seller._id);

  seller.refreshToken = newRefreshToken;
  await seller.save({ validateBeforeSave: false });

  return successResponse(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Session renewed'
  );
});

/**
 * Get Current Authenticated Seller Profile
 * GET /api/v1/seller/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id);
  if (!seller) {
    return errorResponse(res, 'Seller not found', 404);
  }

  return successResponse(
    res,
    {
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        avatar: seller.avatar,
        businessName: seller.businessName,
        businessType: seller.businessType,
        businessDescription: seller.businessDescription,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        status: seller.status,
        rejectionReason: seller.rejectionReason,
        address: seller.address,
        panNumber: seller.panNumber,
        gstin: seller.gstin,
        kycDocuments: seller.kycDocuments,
        bankAccount: {
          accountHolderName: seller.bankAccount?.accountHolderName,
          accountNumber: seller.bankAccount?.accountNumber ? '••••' + seller.bankAccount.accountNumber.slice(-4) : '',
          ifscCode: seller.bankAccount?.ifscCode,
          bankName: seller.bankAccount?.bankName,
          isVerified: seller.bankAccount?.isVerified,
        },
        balance: seller.balance,
        commissionRate: seller.commissionRate,
      },
    },
    'Seller profile retrieved'
  );
});

/**
 * Update Seller Profile & Storefront Details
 * PUT /api/v1/seller/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, businessDescription, storeName, storeLogo, storeBanner, address } = req.body || {};
  const seller = await Seller.findById(req.seller._id);

  if (name) seller.name = name.trim();
  if (phone) seller.phone = phone.trim();
  if (businessDescription !== undefined) seller.businessDescription = businessDescription;
  if (storeName) seller.storeName = storeName.trim();
  if (storeLogo) seller.storeLogo = storeLogo;
  if (storeBanner) seller.storeBanner = storeBanner;
  if (address) {
    seller.address = {
      ...seller.address,
      ...address,
    };
  }

  await seller.save();

  return successResponse(
    res,
    {
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        businessName: seller.businessName,
        storeName: seller.storeName,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        address: seller.address,
        status: seller.status,
      },
    },
    'Profile updated successfully'
  );
});

/**
 * Change Password
 * PUT /api/v1/seller/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Please provide current and new passwords', 400);
  }

  if (newPassword.length < 6) {
    return errorResponse(res, 'New password must be at least 6 characters', 400);
  }

  const seller = await Seller.findById(req.seller._id).select('+password');
  const isMatch = await seller.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 'Current password does not match', 400);
  }

  seller.password = newPassword;
  await seller.save();

  return successResponse(res, null, 'Password updated successfully');
});

/**
 * Seller Logout
 * POST /api/v1/seller/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  if (req.seller) {
    await Seller.findByIdAndUpdate(req.seller._id, { $unset: { refreshToken: 1 } });
  }
  return successResponse(res, null, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};

