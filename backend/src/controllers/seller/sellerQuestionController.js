const ProductQuestion = require('../../models/ProductQuestion');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List questions for seller's own products
 * GET /api/v1/seller/questions
 */
const getSellerQuestions = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const { answered } = req.query;

  const filter = { seller: sellerId };
  if (answered === 'true') filter.isAnswered = true;
  if (answered === 'false') filter.isAnswered = false;

  const [questions, total, pendingCount] = await Promise.all([
    ProductQuestion.find(filter)
      .populate('product', 'productName name images price')
      .populate('user', 'fullName name')
      .sort({ isAnswered: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductQuestion.countDocuments(filter),
    ProductQuestion.countDocuments({ seller: sellerId, isAnswered: false }),
  ]);

  return successResponse(
    res,
    { questions, pendingCount },
    'Seller product questions fetched',
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
 * Submit seller answer to a question
 * POST /api/v1/seller/questions/:id/answer
 */
const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  const sellerId = req.seller._id;

  if (!answer || answer.trim().length < 3) {
    return errorResponse(res, 'Answer must be at least 3 characters', 400);
  }

  const question = await ProductQuestion.findById(req.params.id);
  if (!question) {
    return errorResponse(res, 'Question not found', 404);
  }

  // Enforce isolation: Sellers can only answer questions for their own products
  if (question.seller.toString() !== sellerId.toString()) {
    return errorResponse(res, 'Access denied: You cannot answer questions for other sellers’ products', 403);
  }

  question.answer = answer.trim();
  question.answeredBy = sellerId;
  question.answeredAt = new Date();
  question.isAnswered = true;
  await question.save();

  return successResponse(res, question, 'Answer submitted successfully by verified seller');
});

module.exports = {
  getSellerQuestions,
  answerQuestion,
};

