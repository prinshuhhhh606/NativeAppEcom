/**
 * Seller Return & Refund Management Controller
 */
const SellerOrder = require('../../models/SellerOrder');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List Return Requests for Seller
 * GET /api/v1/seller/returns
 */
const getReturnRequests = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 10, status } = req.query;

  const query = {
    seller: sellerId,
    status: { $in: ['return_requested', 'returned'] },
  };

  if (status && status !== 'all') {
    query.returnStatus = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [returns, totalCount] = await Promise.all([
    SellerOrder.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    SellerOrder.countDocuments(query),
  ]);

  return successResponse(res, returns, 'Return requests fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Approve or Reject Return Request
 * PATCH /api/v1/seller/returns/:id/decision
 */
const handleReturnDecision = asyncHandler(async (req, res) => {
  const { decision, notes } = req.body || {}; // 'approved' or 'rejected'

  if (!['approved', 'rejected', 'received'].includes(decision)) {
    return errorResponse(res, "Decision must be 'approved', 'rejected', or 'received'", 400);
  }

  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!order) {
    return errorResponse(res, 'Return order record not found', 404);
  }

  order.returnStatus = decision;
  if (decision === 'received') {
    order.status = 'returned';
  }

  await order.save();

  return successResponse(res, order, `Return request marked as ${decision}`);
});

module.exports = {
  getReturnRequests,
  handleReturnDecision,
};

