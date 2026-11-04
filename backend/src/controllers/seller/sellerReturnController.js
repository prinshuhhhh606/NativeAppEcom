/**
 * Seller Return & Refund Management Controller
 */
const SellerOrder = require('../../models/SellerOrder');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List Return & Refund Requests for Seller
 * GET /api/v1/seller/returns
 */
const getReturnRequests = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 15, status, search } = req.query;

  const query = {
    seller: sellerId,
    $or: [
      { status: { $in: ['return_requested', 'return_approved', 'return_rejected', 'return_pickup', 'returned', 'refund_processing', 'refunded', 'exchange_requested'] } },
      { 'returnDetails.status': { $in: ['requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refund_processing', 'refund_completed', 'exchange_requested'] } },
      { returnStatus: { $in: ['requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refund_processing', 'refunded', 'exchange_requested'] } },
    ],
  };

  if (status && status !== 'all') {
    const s = status.toLowerCase().trim();
    if (s === 'requested' || s === 'return_requested' || s === 'requests') {
      query.$and = [
        {
          $or: [
            { status: 'return_requested' },
            { returnStatus: 'requested' },
            { 'returnDetails.status': 'requested' },
          ],
        },
      ];
    } else if (s === 'approved' || s === 'return_approved') {
      query.$and = [
        {
          $or: [
            { status: 'return_approved' },
            { returnStatus: 'approved' },
            { 'returnDetails.status': 'approved' },
          ],
        },
      ];
    } else if (s === 'rejected' || s === 'return_rejected') {
      query.$and = [
        {
          $or: [
            { status: 'return_rejected' },
            { returnStatus: 'rejected' },
            { 'returnDetails.status': 'rejected' },
          ],
        },
      ];
    } else if (s === 'pickup' || s === 'return_pickup') {
      query.$and = [
        {
          $or: [
            { status: 'return_pickup' },
            { returnStatus: 'pickup_scheduled' },
            { 'returnDetails.status': 'pickup_scheduled' },
          ],
        },
      ];
    } else if (s === 'returned' || s === 'received') {
      query.$and = [
        {
          $or: [
            { status: 'returned' },
            { returnStatus: 'received' },
            { 'returnDetails.status': 'received' },
          ],
        },
      ];
    } else if (s === 'exchange' || s === 'exchange_requested') {
      query.$and = [
        {
          $or: [
            { status: 'exchange_requested' },
            { 'returnDetails.status': 'exchange_requested' },
          ],
        },
      ];
    } else if (s === 'refund_processing') {
      query.$and = [
        {
          $or: [
            { status: 'refund_processing' },
            { returnStatus: 'refund_processing' },
            { 'returnDetails.status': 'refund_processing' },
          ],
        },
      ];
    } else if (s === 'refund_completed' || s === 'refunded') {
      query.$and = [
        {
          $or: [
            { status: 'refunded' },
            { returnStatus: 'refunded' },
            { 'returnDetails.status': 'refund_completed' },
          ],
        },
      ];
    }
  }

  if (search) {
    query.$or = [
      { subOrderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
      { returnReason: { $regex: search, $options: 'i' } },
      { 'returnDetails.reason': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [returns, totalCount] = await Promise.all([
    SellerOrder.find(query)
      .populate('items.product', 'images productName name price sku')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    SellerOrder.countDocuments(query),
  ]);

  return successResponse(res, { returns, totalCount }, 'Return requests fetched', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Approve, Reject, Schedule Pickup or Process Refund for Return Request
 * PATCH /api/v1/seller/returns/:id/decision
 * PUT /api/v1/seller/returns/:id/process
 */
const handleReturnDecision = asyncHandler(async (req, res) => {
  const { decision, notes, reason } = req.body || {};
  const validDecisions = ['approved', 'rejected', 'pickup_scheduled', 'received', 'refund_processing', 'refunded'];

  if (!validDecisions.includes(decision)) {
    return errorResponse(res, `Decision must be one of: ${validDecisions.join(', ')}`, 400);
  }

  if (decision === 'rejected') {
    const rejectReason = reason || notes || '';
    if (!rejectReason.trim()) {
      return errorResponse(res, 'A mandatory reason is required to reject a return request.', 400);
    }
  }

  const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!order) {
    return errorResponse(res, 'Return order record not found', 404);
  }

  order.returnDetails = order.returnDetails || {};

  if (decision === 'approved') {
    order.returnStatus = 'approved';
    order.status = 'return_approved';
    order.returnDetails.status = 'approved';
    order.returnDetails.approvedDate = new Date();
  } else if (decision === 'rejected') {
    order.returnStatus = 'rejected';
    order.status = 'return_rejected';
    order.returnDetails.status = 'rejected';
    order.returnDetails.rejectedReason = reason || notes || 'Condition requirements not met';
  } else if (decision === 'pickup_scheduled') {
    order.returnStatus = 'pickup_scheduled';
    order.status = 'return_pickup';
    order.returnDetails.status = 'pickup_scheduled';
    order.returnDetails.pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (decision === 'received') {
    order.returnStatus = 'received';
    order.status = 'returned';
    order.returnDetails.status = 'received';
  } else if (decision === 'refund_processing') {
    order.returnStatus = 'refund_processing';
    order.status = 'refund_processing';
    order.returnDetails.status = 'refund_processing';
    order.returnDetails.refundAmount = order.subtotal;
  } else if (decision === 'refunded') {
    order.returnStatus = 'refunded';
    order.status = 'refunded';
    order.paymentStatus = 'Refunded';
    order.returnDetails.status = 'refund_completed';
    order.returnDetails.refundStatus = 'Completed';
  }

  order.shipping = order.shipping || {};
  order.shipping.trackingHistory = order.shipping.trackingHistory || [];
  order.shipping.trackingHistory.push({
    status: `Return: ${decision.toUpperCase().replace(/_/g, ' ')}`,
    location: req.seller.storeName || 'Returns Center',
    timestamp: new Date(),
    remarks: notes || reason || `Return status transitioned to ${decision}`,
  });

  await order.save();

  return successResponse(res, { order }, `Return request marked as ${decision}`);
});

module.exports = {
  getReturnRequests,
  handleReturnDecision,
};

