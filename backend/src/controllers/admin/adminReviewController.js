const Review = require('../../models/Review');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');

/**
 * List reviews across all products
 * GET /api/v1/admin/reviews
 */
const getReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { rating, productId, reported, status } = req.query;
  const filter = {};

  if (rating) filter.rating = Number(rating);
  if (productId) filter.product = productId;
  if (reported === 'true') filter.isReported = true;
  if (status) filter.status = status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name images')
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return successResponse(res, reviews, 'Reviews retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Delete / Remove Review
 * DELETE /api/v1/admin/reviews/:id
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  const productId = review.product;
  await review.deleteOne();

  // Recalculate product rating
  const remainingReviews = await Review.find({ product: productId });
  const avgRating =
    remainingReviews.length > 0
      ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
      : 0;

  await Product.findByIdAndUpdate(productId, {
    numOfReviews: remainingReviews.length,
    ratings: Math.round(avgRating * 10) / 10,
  });

  recordAuditLog(req, 'REVIEW_DELETED', 'reviews', review._id, { productId });

  return successResponse(res, null, 'Review removed and product ratings recalculated');
});

/**
 * Moderate Review (Dismiss report or hide review)
 * PATCH /api/v1/admin/reviews/:id/moderate
 */
const moderateReview = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'hide', 'approve', 'dismiss_report'
  const review = await Review.findById(req.params.id);

  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  if (action === 'hide') {
    review.status = 'hidden';
  } else if (action === 'approve') {
    review.status = 'active';
    review.isReported = false;
  } else if (action === 'dismiss_report') {
    review.isReported = false;
    review.reportReason = '';
    review.reportCount = 0;
    if (review.status === 'flagged') review.status = 'active';
  }

  await review.save();
  return successResponse(res, review, `Review marked as ${review.status}`);
});

module.exports = {
  getReviews,
  deleteReview,
  moderateReview,
};

