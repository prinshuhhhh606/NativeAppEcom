const ReturnRequest = require('../../models/ReturnRequest');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Inventory = require('../../models/Inventory');
const InventoryTransaction = require('../../models/InventoryTransaction');
const Refund = require('../../models/Refund');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const paymentService = require('../../services/paymentService');
const { emitRefundUpdated } = require('../../sockets/socketManager');

/**
 * List all return requests
 * GET /api/v1/admin/returns
 */
const getReturnRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  const [returns, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate('user', 'name email phone')
      .populate('order', 'orderId pricing.grandTotal paymentMethod')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ReturnRequest.countDocuments(filter),
  ]);

  return successResponse(res, returns, 'Return requests retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get Return Request Details
 * GET /api/v1/admin/returns/:id
 */
const getReturnDetails = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('order');

  if (!returnRequest) {
    return errorResponse(res, 'Return request not found', 404);
  }

  return successResponse(res, returnRequest, 'Return request details retrieved');
});

/**
 * Process Return Request (Approve, Reject, or Mark Refunded)
 * PATCH /api/v1/admin/returns/:id/process
 */
const processReturn = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const returnRequest = await ReturnRequest.findById(req.params.id).populate('order');
  if (!returnRequest) {
    return errorResponse(res, 'Return request not found', 404);
  }

  returnRequest.status = status;
  if (adminNotes) returnRequest.adminNotes = adminNotes;

  // If approved and received, restore stock back into inventory
  if (status === 'Approved' || status === 'Received') {
    if (returnRequest.items && returnRequest.items.length > 0) {
      for (const item of returnRequest.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity || 1 } });
          await Inventory.findOneAndUpdate({ product: item.product }, { $inc: { currentStock: item.quantity || 1 } });
          await InventoryTransaction.create({
            product: item.product,
            sku: item.name || 'Returned Item',
            type: 'RETURN_RESTORE',
            previousQuantity: 0,
            newQuantity: item.quantity || 1,
            changeQuantity: item.quantity || 1,
            reason: `Return Request approved for order #${returnRequest.order?.orderId}`,
            admin: req.admin?._id,
            order: returnRequest.order?._id,
          });
        }
      }
    }
  }

  // If status is Refunded, trigger gateway refund
  if (status === 'Refunded') {
    returnRequest.refundStatus = 'Completed';
    returnRequest.refundedAt = new Date();

    let gatewayRefund = null;
    if (returnRequest.order?.razorpayPaymentId) {
      try {
        gatewayRefund = await paymentService.processRefund(
          returnRequest.order.razorpayPaymentId,
          returnRequest.refundAmount,
          { returnRequestId: returnRequest._id.toString() }
        );
      } catch (refundErr) {
        console.warn('Gateway refund notice:', refundErr.message);
      }
    }

    const refund = await Refund.create({
      order: returnRequest.order?._id,
      returnRequest: returnRequest._id,
      amount: returnRequest.refundAmount,
      method: returnRequest.refundMethod || 'Original',
      status: 'Processed',
      gatewayRefundId: gatewayRefund?.id || `rfnd_ret_${Date.now()}`,
      reason: returnRequest.reason,
      processedBy: req.admin?._id,
      processedAt: new Date(),
    });

    emitRefundUpdated(refund);
  }

  await returnRequest.save();

  recordAuditLog(req, 'RETURN_PROCESSED', 'returns', returnRequest._id, { status, adminNotes });

  return successResponse(res, returnRequest, `Return request status updated to ${status}`);
});

module.exports = {
  getReturnRequests,
  getReturnDetails,
  processReturn,
};

