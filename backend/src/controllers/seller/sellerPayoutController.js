/**
 * Seller Payout Controller
 * Manages bank withdrawal requests, status tracking, and ledger deductions
 */
const Payout = require('../../models/Payout');
const Seller = require('../../models/Seller');
const SellerLedger = require('../../models/SellerLedger');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { getIO } = require('../../sockets/socketManager');

/**
 * List Seller Payouts
 * GET /api/v1/seller/payouts
 */
const getPayouts = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 10, status } = req.query;

  const query = { seller: sellerId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payouts, totalCount] = await Promise.all([
    Payout.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Payout.countDocuments(query),
  ]);

  return successResponse(res, payouts, 'Payout history fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Request Payout Settlement
 * POST /api/v1/seller/payouts/request
 */
const requestPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body || {};
  const withdrawAmount = Number(amount);

  if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 500) {
    return errorResponse(res, 'Minimum payout request amount is ₹500.', 400);
  }

  const seller = await Seller.findById(req.seller._id);

  if (!seller.bankAccount?.accountNumber || !seller.bankAccount?.ifscCode) {
    return errorResponse(res, 'Please configure your verified Bank Account in Settings before requesting a payout.', 400);
  }

  if (seller.balance.available < withdrawAmount) {
    return errorResponse(
      res,
      `Insufficient available balance. You have ₹${seller.balance.available} available for withdrawal.`,
      400
    );
  }

  // Generate unique Payout ID
  const payoutId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Deduct from available balance
  seller.balance.available -= withdrawAmount;
  await seller.save();

  const payout = await Payout.create({
    payoutId,
    seller: seller._id,
    amount: withdrawAmount,
    bankDetailsSnapshot: {
      accountHolderName: seller.bankAccount.accountHolderName,
      accountNumberMasked: '••••' + seller.bankAccount.accountNumber.slice(-4),
      ifscCode: seller.bankAccount.ifscCode,
      bankName: seller.bankAccount.bankName,
    },
    status: 'pending',
  });

  // Record in Financial Ledger
  await SellerLedger.create({
    transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
    seller: seller._id,
    type: 'debit',
    category: 'payout_withdrawal',
    amount: withdrawAmount,
    balanceAfter: seller.balance.available,
    referenceId: payoutId,
    description: `Payout withdrawal request ${payoutId} submitted for processing`,
    status: 'pending',
  });

  // Notify Admin Panel via Socket
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('new_payout_request', {
        payoutId: payout.payoutId,
        sellerName: seller.name,
        businessName: seller.businessName,
        amount: withdrawAmount,
        bankName: seller.bankAccount.bankName,
        requestedAt: new Date(),
      });
    }
  } catch (err) {}

  return successResponse(
    res,
    payout,
    `Payout request of ₹${withdrawAmount} submitted successfully. Admin review in progress.`,
    201
  );
});

/**
 * Get Specific Payout Details
 * GET /api/v1/seller/payouts/:id
 */
const getPayoutDetails = asyncHandler(async (req, res) => {
  const payout = await Payout.findOne({
    $or: [{ _id: req.params.id }, { payoutId: req.params.id }],
    seller: req.seller._id,
  });

  if (!payout) {
    return errorResponse(res, 'Payout record not found', 404);
  }

  return successResponse(res, payout, 'Payout details retrieved');
});

module.exports = {
  getPayouts,
  requestPayout,
  getPayoutDetails,
};

