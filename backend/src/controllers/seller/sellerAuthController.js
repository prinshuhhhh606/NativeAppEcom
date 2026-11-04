/**
 * Seller Authentication Controller
 */
const Seller = require('../../models/Seller');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/generateToken');
const { syncSellerToUser } = require('../../utils/dualAccountBridge');
const notificationService = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const crypto = require('crypto');

/**
 * Register New Seller
 * POST /api/v1/seller/auth/register
 */
/**
 * Register New Seller
 * Simplified Workflow: Registration -> Admin Approval -> Seller Login
 * No KYC, document uploads, or bank details required during registration.
 * POST /api/v1/seller/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    phone,
    mobileNumber,
    businessName,
    storeName,
    businessType = 'proprietorship',
  } = req.body || {};

  const sellerPhone = (phone || mobileNumber || '').toString().trim();
  const sellerName = (name || '').toString().trim();
  const sellerEmail = (email || '').toString().toLowerCase().trim();

  if (!sellerName || !sellerEmail || !password || !sellerPhone) {
    return errorResponse(res, 'Please provide all required fields: Seller Name, Email, Mobile Number, and Password.', 400);
  }

  if (confirmPassword && password !== confirmPassword) {
    return errorResponse(res, 'Password and Confirm Password do not match.', 400);
  }

  const existingEmail = await Seller.findOne({ email: sellerEmail });
  if (existingEmail) {
    return errorResponse(res, 'A seller account with this email already exists. Please log in or wait for Admin approval.', 409);
  }

  const finalBusinessName = (businessName && businessName.trim()) || `${sellerName} Store`;
  const cleanStoreName = (storeName && storeName.trim()) || finalBusinessName;
  const storeSlug = cleanStoreName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  // Create Seller with PENDING status. Zero mandatory KYC required.
  const seller = await Seller.create({
    name: sellerName,
    email: sellerEmail,
    password,
    phone: sellerPhone,
    businessName: finalBusinessName,
    businessType,
    storeName: cleanStoreName,
    storeSlug,
    status: 'pending',
    isVerified: false,
    isActive: true,
  });

  // Dual Access System: provision shadow customer User record for future shopping
  await syncSellerToUser(seller);

  // Notify Admin of new registration awaiting approval
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('admin:new_seller_registered', {
        sellerId: seller._id,
        name: seller.name,
        businessName: seller.businessName,
        email: seller.email,
        phone: seller.phone,
        status: seller.status,
        createdAt: seller.createdAt,
      });
    }
  } catch (e) {}

  const sellerResponse = {
    id: seller._id,
    _id: seller._id,
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    businessName: seller.businessName,
    storeName: seller.storeName,
    status: 'pending',
    isApproved: false,
    createdAt: seller.createdAt,
  };

  return res.status(201).json({
    success: true,
    message: 'Your seller registration has been submitted successfully. Please wait for Admin approval.',
    status: 'pending',
    requiresApproval: true,
    seller: sellerResponse,
    data: {
      seller: sellerResponse,
      status: 'pending',
      requiresApproval: true,
    },
  });
});

/**
 * Seller Login
 * Enforces strict backend status verification:
 * - PENDING: Blocked with "Your account is waiting for Admin approval."
 * - REJECTED: Blocked with Admin rejection reason.
 * - SUSPENDED: Blocked with account suspension message.
 * - APPROVED: Login successful -> Token issued -> Dashboard unlocked.
 * POST /api/v1/seller/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return errorResponse(res, 'Please enter registered email and password', 400);
  }

  const seller = await Seller.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!seller) {
    return errorResponse(res, 'Invalid seller email or password', 401);
  }

  const isMatch = await seller.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 'Invalid seller email or password', 401);
  }

  // Check Seller Approval Status on Backend
  const sellerStatus = (seller.status || 'pending').toLowerCase();

  if (sellerStatus === 'pending' || sellerStatus === 'pending_verification' || sellerStatus === 'under_review') {
    return errorResponse(
      res,
      'Your account is waiting for Admin approval.',
      403,
      {
        status: 'pending',
        sellerStatus: 'pending',
        requiresApproval: true,
      }
    );
  }

  if (sellerStatus === 'rejected') {
    const reason = seller.rejectionReason || 'Application criteria not met. Please contact support.';
    return errorResponse(
      res,
      `Your seller account has been rejected by Admin. Reason: ${reason}`,
      403,
      {
        status: 'rejected',
        sellerStatus: 'rejected',
        rejectionReason: reason,
      }
    );
  }

  if (sellerStatus === 'suspended' || sellerStatus === 'blocked' || !seller.isActive) {
    return errorResponse(
      res,
      'Your seller account has been suspended by the administrator. Please contact support.',
      403,
      {
        status: 'suspended',
        sellerStatus: 'suspended',
      }
    );
  }

  // At this point, seller.status is APPROVED!
  const accessToken = generateAccessToken(seller._id, 'seller');
  const refreshToken = generateRefreshToken(seller._id);

  seller.refreshToken = refreshToken;
  seller.lastLogin = new Date();
  await seller.save({ validateBeforeSave: false });

  // Dual Access System: Automatically ensure shadow User exists
  await syncSellerToUser(seller);

  return successResponse(
    res,
    {
      seller: {
        id: seller._id,
        _id: seller._id,
        name: seller.name,
        fullName: seller.name,
        email: seller.email,
        phone: seller.phone,
        mobileNumber: seller.phone,
        avatar: seller.avatar,
        businessName: seller.businessName,
        businessType: seller.businessType,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        status: 'approved',
        isApproved: true,
        isVerified: true,
        address: seller.address,
        balance: seller.balance,
        commissionRate: seller.commissionRate,
        role: 'seller',
        isSeller: true,
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

  const seller = await Seller.findById(decoded.id).select('+refreshToken +previousRefreshToken');
  if (!seller) {
    return errorResponse(res, 'Seller account not found. Please login again.', 401);
  }

  // Grace period check: allow current refreshToken OR previousRefreshToken (within 60s)
  // to avoid race conditions with multiple parallel requests during rotation
  const isCurrent = seller.refreshToken === incomingToken;
  const isPreviousValid =
    seller.previousRefreshToken === incomingToken &&
    seller.previousRefreshTokenExpires &&
    new Date() < new Date(seller.previousRefreshTokenExpires);

  if (!isCurrent && !isPreviousValid) {
    return errorResponse(res, 'Session terminated or invalid refresh token. Please login again.', 401);
  }

  const newAccessToken = generateAccessToken(seller._id, 'seller');
  const newRefreshToken = generateRefreshToken(seller._id);

  seller.previousRefreshToken = seller.refreshToken;
  seller.previousRefreshTokenExpires = new Date(Date.now() + 60 * 1000);
  seller.refreshToken = newRefreshToken;
  await seller.save({ validateBeforeSave: false });

  // Sync to shadow User record so dual-access customer calls also remain authenticated
  try {
    const User = require('../../models/User');
    const shadowUser =
      (await User.findById(seller._id)) ||
      (seller.email ? await User.findOne({ email: seller.email.toLowerCase().trim() }) : null);
    if (shadowUser) {
      shadowUser.previousRefreshToken = shadowUser.refreshToken;
      shadowUser.previousRefreshTokenExpires = seller.previousRefreshTokenExpires;
      shadowUser.refreshToken = newRefreshToken;
      await shadowUser.save({ validateBeforeSave: false });
    }
  } catch (syncErr) {}

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
        isApproved: seller.status === 'approved',
        isVerified: seller.isVerified || seller.status === 'approved',
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

