/**
 * Seller Earnings & Commission Controller
 * Complete financial oversight, gross vs net revenue, and transaction ledger
 */
const Seller = require('../../models/Seller');
const SellerOrder = require('../../models/SellerOrder');
const SellerLedger = require('../../models/SellerLedger');
const Payout = require('../../models/Payout');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Seller Financial Overview
 * GET /api/v1/seller/earnings/summary
 */
const getEarningsSummary = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const seller = await Seller.findById(sellerId).select('balance commissionRate');

  const [orderTotals, pendingSettlements, totalPayouts] = await Promise.all([
    SellerOrder.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$subtotal' },
          totalCommission: { $sum: '$commissionAmount' },
          netEarnings: { $sum: '$netEarnings' },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    SellerOrder.aggregate([
      { $match: { seller: sellerId, status: { $in: ['shipped', 'delivered', 'accepted', 'processing', 'packed'] } } },
      { $group: { _id: null, pendingAmt: { $sum: '$netEarnings' } } },
    ]),
    Payout.aggregate([
      { $match: { seller: sellerId, status: 'completed' } },
      { $group: { _id: null, totalWithdrawn: { $sum: '$amount' } } },
    ]),
  ]);

  const stats = orderTotals[0] || { grossRevenue: 0, totalCommission: 0, netEarnings: 0, totalOrders: 0 };
  const withdrawn = totalPayouts[0]?.totalWithdrawn || seller.balance?.totalWithdrawn || 0;

  return successResponse(
    res,
    {
      grossRevenue: stats.grossRevenue,
      platformCommission: stats.totalCommission,
      netEarnings: stats.netEarnings,
      commissionRate: seller.commissionRate || 10,
      availableBalance: seller.balance?.available || 0,
      pendingBalance: seller.balance?.pending || 0,
      totalWithdrawn: withdrawn,
      totalOrders: stats.totalOrders,
    },
    'Financial summary retrieved'
  );
});

/**
 * Get Financial Transaction Ledger
 * GET /api/v1/seller/earnings/ledger
 */
const getLedger = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 15, type } = req.query;

  const query = { seller: sellerId };
  if (type && type !== 'all') {
    query.type = type;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, totalCount] = await Promise.all([
    SellerLedger.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    SellerLedger.countDocuments(query),
  ]);

  return successResponse(res, transactions, 'Financial ledger fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

module.exports = {
  getEarningsSummary,
  getLedger,
};

