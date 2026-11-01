const ProductQuestion = require('../../models/ProductQuestion');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List all questions for admin moderation
 * GET /api/v1/admin/questions
 */
const getAllQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const { reported, status, productId } = req.query;

  const filter = {};
  if (reported === 'true') filter.isReported = true;
  if (status) filter.status = status;
  if (productId) filter.product = productId;

  const [questions, total, reportedCount] = await Promise.all([
    ProductQuestion.find(filter)
      .populate('product', 'productName name images')
      .populate('seller', 'storeName businessName')
      .populate('user', 'fullName name email')
      .sort({ isReported: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductQuestion.countDocuments(filter),
    ProductQuestion.countDocuments({ isReported: true }),
  ]);

  return successResponse(
    res,
    { questions, reportedCount },
    'Questions fetched for moderation',
    200,
    {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  );
});

/**
 * Moderate question (Approve, Hide, Dismiss report)
 * PATCH /api/v1/admin/questions/:id/moderate
 */
const moderateQuestion = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve', 'hide', 'dismiss_report'
  const item = await ProductQuestion.findById(req.params.id);

  if (!item) {
    return errorResponse(res, 'Question not found', 404);
  }

  if (action === 'hide') {
    item.status = 'hidden';
  } else if (action === 'approve') {
    item.status = 'approved';
    item.isReported = false;
  } else if (action === 'dismiss_report') {
    item.isReported = false;
    item.reportReason = '';
    item.reportCount = 0;
    if (item.status === 'flagged') item.status = 'approved';
  }

  await item.save();
  return successResponse(res, item, `Question marked as ${item.status}`);
});

/**
 * Delete inappropriate/spam question
 * DELETE /api/v1/admin/questions/:id
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  const item = await ProductQuestion.findById(req.params.id);
  if (!item) {
    return errorResponse(res, 'Question not found', 404);
  }

  await item.deleteOne();
  return successResponse(res, null, 'Question deleted successfully');
});

module.exports = {
  getAllQuestions,
  moderateQuestion,
  deleteQuestion,
};

