/**
 * Seller Verification & KYC Controller
 */
const Seller = require('../../models/Seller');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { getIO } = require('../../sockets/socketManager');

/**
 * Update KYC & Business Verification Details
 * PUT /api/v1/seller/verification/kyc
 */
const updateKyc = asyncHandler(async (req, res) => {
  const { panNumber, gstin, kycDocuments, bankAccount } = req.body || {};
  const seller = await Seller.findById(req.seller._id);

  if (panNumber) seller.panNumber = panNumber.trim().toUpperCase();
  if (gstin) seller.gstin = gstin.trim().toUpperCase();

  if (kycDocuments) {
    seller.kycDocuments = {
      ...seller.kycDocuments,
      ...kycDocuments,
    };
  }

  if (bankAccount) {
    seller.bankAccount = {
      ...seller.bankAccount,
      accountHolderName: bankAccount.accountHolderName || seller.bankAccount.accountHolderName,
      accountNumber: bankAccount.accountNumber || seller.bankAccount.accountNumber,
      ifscCode: (bankAccount.ifscCode || seller.bankAccount.ifscCode || '').toUpperCase().trim(),
      bankName: bankAccount.bankName || seller.bankAccount.bankName,
      branchName: bankAccount.branchName || seller.bankAccount.branchName,
    };
  }

  await seller.save();

  return successResponse(
    res,
    {
      panNumber: seller.panNumber,
      gstin: seller.gstin,
      kycDocuments: seller.kycDocuments,
      bankAccount: {
        accountHolderName: seller.bankAccount.accountHolderName,
        accountNumber: seller.bankAccount.accountNumber ? '••••' + seller.bankAccount.accountNumber.slice(-4) : '',
        ifscCode: seller.bankAccount.ifscCode,
        bankName: seller.bankAccount.bankName,
      },
      status: seller.status,
    },
    'KYC and business details saved'
  );
});

/**
 * Submit KYC for Admin Approval
 * POST /api/v1/seller/verification/submit
 */
const submitKycForReview = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id);

  if (!seller.panNumber) {
    return errorResponse(res, 'PAN number is required before submitting verification.', 400);
  }

  if (!seller.bankAccount?.accountNumber || !seller.bankAccount?.ifscCode) {
    return errorResponse(res, 'Bank Account number and IFSC code are required before submitting verification.', 400);
  }

  seller.status = 'under_review';
  seller.kycSubmittedAt = new Date();
  seller.rejectionReason = '';
  await seller.save();

  // Real-time alert to Admin Panel
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('seller_verification_submitted', {
        sellerId: seller._id,
        sellerName: seller.name,
        businessName: seller.businessName,
        email: seller.email,
        submittedAt: seller.kycSubmittedAt,
      });
    }
  } catch (err) {}

  return successResponse(
    res,
    { status: seller.status, submittedAt: seller.kycSubmittedAt },
    'KYC submitted successfully. Admin review is in progress.'
  );
});

/**
 * Get KYC Verification Status
 * GET /api/v1/seller/verification/status
 */
const getKycStatus = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id);

  return successResponse(
    res,
    {
      status: seller.status,
      rejectionReason: seller.rejectionReason,
      kycSubmittedAt: seller.kycSubmittedAt,
      panNumber: seller.panNumber,
      gstin: seller.gstin,
      kycDocuments: seller.kycDocuments,
      bankAccount: {
        accountHolderName: seller.bankAccount?.accountHolderName,
        accountNumberMasked: seller.bankAccount?.accountNumber ? '••••' + seller.bankAccount.accountNumber.slice(-4) : '',
        ifscCode: seller.bankAccount?.ifscCode,
        bankName: seller.bankAccount?.bankName,
        isVerified: seller.bankAccount?.isVerified,
      },
    },
    'KYC status retrieved'
  );
});

module.exports = {
  updateKyc,
  submitKycForReview,
  getKycStatus,
};

