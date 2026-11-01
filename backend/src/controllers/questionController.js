const ProductQuestion = require('../models/ProductQuestion');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get approved questions for a product
 * GET /api/questions/product/:productId
 */
const getProductQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const productId = req.params.productId;

  const filter = {
    product: productId,
    status: { $in: ['approved', 'flagged'] },
  };

  const [questions, total] = await Promise.all([
    ProductQuestion.find(filter)
      .populate('answeredBy', 'storeName businessName')
      .sort({ isAnswered: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductQuestion.countDocuments(filter),
  ]);

  return successResponse(res, questions, 'Product questions retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Ask a question about a product
 * POST /api/questions
 */
const askQuestion = asyncHandler(async (req, res) => {
  const { productId, question } = req.body;

  if (!productId) {
    return errorResponse(res, 'Product ID is required', 400);
  }

  if (!question || question.trim().length < 5) {
    return errorResponse(res, 'Question must be at least 5 characters long', 400);
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found or unavailable', 404);
  }

  const newQuestion = await ProductQuestion.create({
    product: productId,
    user: req.user._id,
    customerName: req.user.fullName || req.user.name || 'Verified Customer',
    seller: product.seller,
    question: question.trim(),
    status: 'approved',
  });

  return successResponse(res, newQuestion, 'Question posted successfully. The seller will answer shortly.', 201);
});

/**
 * Report an inappropriate question or answer
 * POST /api/questions/:id/report
 */
const reportQuestion = asyncHandler(async (req, res) => {
  const { reason = 'Inappropriate content' } = req.body || {};
  const item = await ProductQuestion.findById(req.params.id);

  if (!item) {
    return errorResponse(res, 'Question not found', 404);
  }

  item.isReported = true;
  item.reportReason = reason;
  item.reportCount = (item.reportCount || 0) + 1;
  if (item.reportCount >= 3) {
    item.status = 'flagged';
  }
  await item.save();

  return successResponse(res, null, 'Thank you. Question reported for moderator review.');
});

module.exports = {
  getProductQuestions,
  askQuestion,
  reportQuestion,
};

