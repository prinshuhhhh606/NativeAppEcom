/**
 * Admin Seller Management Controller
 * Allows platform administrators to review seller KYC, approve/reject sellers,
 * approve/reject seller products, and process vendor payouts.
 */
const Seller = require('../../models/Seller');
const Product = require('../../models/Product');
const Payout = require('../../models/Payout');
const SellerLedger = require('../../models/SellerLedger');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { emitToSeller, getIO } = require('../../sockets/socketManager');
const { syncSellerToUser } = require('../../utils/dualAccountBridge');
const notificationService = require('../../services/notificationService');

/**
 * List All Sellers
 * GET /api/v1/admin/sellers
 */
const getSellers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, search } = req.query;
  const query = {};

  if (status && status !== 'all') {
    const s = status.toLowerCase().trim();
    if (s === 'pending' || s === 'pending_verification') {
      query.status = { $in: ['pending', 'pending_verification', 'under_review'] };
    } else if (s === 'suspended') {
      query.status = { $in: ['suspended', 'blocked'] };
    } else {
      query.status = s;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
      { storeName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [sellers, totalCount] = await Promise.all([
    Seller.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Seller.countDocuments(query),
  ]);

  return successResponse(res, sellers, 'Sellers fetched successfully', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Get Specific Seller Details & Verification Documents
 * GET /api/v1/admin/sellers/:id
 */
const getSellerDetails = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id);
  if (!seller) {
    return errorResponse(res, 'Seller not found', 404);
  }

  const productCount = await Product.countDocuments({ seller: seller._id });
  return successResponse(res, { seller, productCount }, 'Seller details retrieved');
});

/**
 * Update Seller Verification Status (Approve / Reject / Suspend)
 * PATCH /api/v1/admin/sellers/:id/status
 */
const updateSellerStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body || {};

  const validStatuses = ['pending', 'pending_verification', 'under_review', 'approved', 'rejected', 'suspended', 'blocked'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid status provided', 400);
  }

  const seller = await Seller.findById(req.params.id);
  if (!seller) {
    return errorResponse(res, 'Seller not found', 404);
  }

  seller.status = status;
  if (status === 'approved') {
    seller.isVerified = true;
    seller.approvedAt = new Date();
    seller.rejectionReason = '';
    seller.isActive = true;
  } else if (status === 'rejected') {
    seller.isVerified = false;
    seller.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Account details rejected by administrator.';
  } else if (status === 'suspended' || status === 'blocked') {
    seller.isActive = false;
    if (rejectionReason) seller.rejectionReason = rejectionReason.trim();
  } else {
    seller.isVerified = false;
  }

  await seller.save();

  // Dual Access System: synchronize status with shadow User account
  try {
    await syncSellerToUser(seller);
  } catch (syncErr) {
    console.warn('Sync seller to user error on status update:', syncErr?.message);
  }

  // Persistent Notification to Seller
  try {
    let notifTitle = 'Seller Account Status Update';
    let notifMsg = `Your seller account status has been updated to: ${status.toUpperCase()}`;

    if (status === 'approved') {
      notifTitle = 'Seller Registration Approved! 🎉';
      notifMsg = 'Congratulations! Your seller registration has been approved by the Admin. You can now log in to your dashboard, list products, and manage orders.';
    } else if (status === 'rejected') {
      notifTitle = 'Seller Registration Rejected';
      notifMsg = `Your seller registration was rejected by Admin. Reason: ${seller.rejectionReason || 'Details criteria not met.'}`;
    } else if (status === 'suspended') {
      notifTitle = 'Seller Account Suspended';
      notifMsg = `Your seller account has been suspended by the administrator. Reason: ${seller.rejectionReason || 'Policy review.'}`;
    }

    await notificationService.createNotification(seller._id, {
      title: notifTitle,
      message: notifMsg,
      type: 'order',
      recipientType: 'seller',
      data: { status, rejectionReason: seller.rejectionReason },
    });
  } catch (notifErr) {
    console.warn('Seller notification error on status update:', notifErr?.message);
  }

  // Notify Seller in real-time
  try {
    emitToSeller(seller._id, 'account_status_updated', {
      status,
      isVerified: seller.isVerified,
      rejectionReason: seller.rejectionReason,
      updatedAt: new Date(),
    });
  } catch (e) {}

  return successResponse(res, seller, `Seller status updated to ${status}`);
});

/**
 * Update Seller Platform Commission Rate
 * PATCH /api/v1/admin/sellers/:id/commission
 */
const updateSellerCommission = asyncHandler(async (req, res) => {
  const { commissionRate } = req.body || {};
  const rate = Number(commissionRate);

  if (isNaN(rate) || rate < 0 || rate > 50) {
    return errorResponse(res, 'Commission rate must be a percentage between 0 and 50%', 400);
  }

  const seller = await Seller.findById(req.params.id);
  if (!seller) {
    return errorResponse(res, 'Seller not found', 404);
  }

  seller.commissionRate = rate;
  await seller.save();

  return successResponse(res, seller, `Commission rate updated to ${rate}%`);
});

/**
 * List Products Pending Admin Approval
 * GET /api/v1/admin/seller-products/pending
 */
const getPendingProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, totalCount] = await Promise.all([
    Product.find({ approvalStatus: { $in: ['pending', 'pending_approval'] } })
      .populate('seller', 'name businessName storeName email phone address')
      .populate('category', 'name categoryName slug icon')
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments({ approvalStatus: { $in: ['pending', 'pending_approval'] } }),
  ]);

  return successResponse(res, products, 'Pending products fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Approve or Reject Seller Product
 * PATCH /api/v1/admin/seller-products/:id/approval
 */
const handleProductApproval = asyncHandler(async (req, res) => {
  const { decision, rejectionReason } = req.body || {}; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(decision)) {
    return errorResponse(res, "Decision must be 'approved' or 'rejected'", 400);
  }

  if (decision === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return errorResponse(res, 'A rejection reason is mandatory when rejecting a product', 400);
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  product.approvalStatus = decision;
  product.isActive = decision === 'approved';
  if (decision === 'approved') {
    product.rejectionReason = '';
  } else {
    product.rejectionReason = rejectionReason.trim();
  }

  await product.save();

  // Notify Seller in real-time
  try {
    if (product.seller) {
      emitToSeller(product.seller, 'product_approval_updated', {
        productId: product._id,
        productName: product.productName,
        approvalStatus: decision,
        rejectionReason: product.rejectionReason,
      });
    }
  } catch (e) {}

  return successResponse(res, product, `Product marked as ${decision}`);
});

/**
 * List All Seller Payout Requests
 * GET /api/v1/admin/payouts
 */
const getAllPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status } = req.query;
  const query = {};
  if (status && status !== 'all') {
    const s = status.toLowerCase().trim();
    if (s === 'pending' || s === 'pending_verification') {
      query.status = { $in: ['pending', 'pending_verification', 'under_review'] };
    } else if (s === 'suspended') {
      query.status = { $in: ['suspended', 'blocked'] };
    } else {
      query.status = s;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payouts, totalCount] = await Promise.all([
    Payout.find(query)
      .populate('seller', 'name businessName storeName email phone bankAccount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payout.countDocuments(query),
  ]);

  return successResponse(res, payouts, 'Payouts fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Update Payout Status (Process, Complete, or Reject)
 * PATCH /api/v1/admin/payouts/:id/status
 */
const updatePayoutStatus = asyncHandler(async (req, res) => {
  const { status, transactionReference, rejectionReason, adminNotes } = req.body || {};

  const validStatuses = ['approved', 'processing', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid payout status', 400);
  }

  const payout = await Payout.findById(req.params.id);
  if (!payout) {
    return errorResponse(res, 'Payout record not found', 404);
  }

  payout.status = status;
  if (transactionReference) payout.transactionReference = transactionReference;
  if (adminNotes) payout.adminNotes = adminNotes;
  if (status === 'completed') {
    payout.processedAt = new Date();
    payout.processedBy = req.admin?._id;

    // Increment seller totalWithdrawn
    await Seller.findByIdAndUpdate(payout.seller, {
      $inc: { 'balance.totalWithdrawn': payout.amount },
    });
  }

  // If rejected, refund the money back to the seller's available balance!
  if (status === 'rejected') {
    payout.rejectionReason = rejectionReason || 'Rejected by Admin';
    const seller = await Seller.findById(payout.seller);
    if (seller) {
      seller.balance.available += payout.amount;
      await seller.save();

      // Ledger reversal entry
      await SellerLedger.create({
        transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
        seller: seller._id,
        type: 'credit',
        category: 'adjustment',
        amount: payout.amount,
        balanceAfter: seller.balance.available,
        referenceId: payout.payoutId,
        description: `Reversal of rejected payout ${payout.payoutId}: ${payout.rejectionReason}`,
        status: 'cleared',
      });
    }
  }

  await payout.save();

  // Real-time alert to Seller
  try {
    emitToSeller(payout.seller, 'payout_status_updated', {
      payoutId: payout.payoutId,
      status,
      amount: payout.amount,
      transactionReference: payout.transactionReference,
      rejectionReason: payout.rejectionReason,
    });
  } catch (e) {}

  return successResponse(res, payout, `Payout status updated to ${status}`);
});

module.exports = {
  getSellers,
  getSellerDetails,
  updateSellerStatus,
  updateSellerCommission,
  getPendingProducts,
  handleProductApproval,
  getAllPayouts,
  updatePayoutStatus,
};

