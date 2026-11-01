const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * Get all reviews for a product with rating statistics breakdown
 * GET /api/reviews/product/:productId
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const productId = req.params.productId;

  const [reviews, total, allProductReviews] = await Promise.all([
    Review.find({ product: productId, status: { $ne: 'hidden' } })
      .populate('user', 'fullName name profileImage avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: productId, status: { $ne: 'hidden' } }),
    Review.find({ product: productId, status: { $ne: 'hidden' } }).select('rating'),
  ]);

  // Compute 5-star distribution breakdown
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let ratingSum = 0;
  allProductReviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
      ratingSum += r.rating;
    }
  });

  const avgRating = total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0;

  return successResponse(
    res,
    {
      reviews,
      stats: {
        averageRating: avgRating,
        totalReviews: total,
        breakdown,
      },
    },
    'Product reviews fetched',
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
 * Check if the current user is eligible to review the product
 * GET /api/reviews/check-eligibility/:productId
 */
const checkReviewEligibility = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  // Check if delivered order exists
  const deliveredOrder = await Order.findOne({
    user: userId,
    'items.product': productId,
    orderStatus: 'Delivered',
  });

  // Check if already reviewed
  const existingReview = await Review.findOne({ product: productId, user: userId });

  return successResponse(res, {
    eligible: !!deliveredOrder || req.user.role === 'admin',
    deliveredOrderId: deliveredOrder?._id || null,
    hasReviewed: !!existingReview,
    existingReview,
  });
});

/**
 * Create or update product review
 * POST /api/reviews
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, title } = req.body;
  const numRating = Number(rating);

  if (!numRating || numRating < 1 || numRating > 5) {
    return errorResponse(res, 'Rating must be between 1 and 5 stars', 400);
  }

  if (!comment || comment.trim().length < 5) {
    return errorResponse(res, 'Review comment must be at least 5 characters', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Verify delivered purchase
  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'Delivered',
  });

  const isVerifiedPurchase = !!deliveredOrder || req.user.role === 'admin';
  if (!isVerifiedPurchase) {
    return errorResponse(
      res,
      'Only verified customers who have purchased and received this product can submit a review.',
      403
    );
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'reviews');
    images = uploaded.map((img) => img.url);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  let review = await Review.findOne({ product: productId, user: req.user._id });

  if (review) {
    review.rating = numRating;
    review.comment = comment.trim();
    if (images.length > 0) review.images = images;
    if (deliveredOrder) review.order = deliveredOrder._id;
    review.isVerifiedPurchase = true;
    await review.save();
  } else {
    review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: numRating,
      comment: comment.trim(),
      images,
      order: deliveredOrder?._id,
      isVerifiedPurchase: true,
    });
  }

  // Recalculate average rating for product
  const allReviews = await Review.find({ product: productId, status: { $ne: 'hidden' } });
  const avgRating = allReviews.length > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
    : 0;

  await Product.findByIdAndUpdate(productId, {
    numOfReviews: allReviews.length,
    reviewsCount: allReviews.length,
    ratings: avgRating,
  });

  return successResponse(res, review, 'Review submitted successfully', 201);
});

/**
 * Update an existing review
 * PUT /api/reviews/:id
 */
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to edit this review', 403);
  }

  if (rating) {
    const num = Number(rating);
    if (num < 1 || num > 5) return errorResponse(res, 'Rating must be 1-5', 400);
    review.rating = num;
  }
  if (comment) review.comment = comment.trim();
  if (images && Array.isArray(images)) review.images = images;

  await review.save();

  // Recalculate
  const allReviews = await Review.find({ product: review.product, status: { $ne: 'hidden' } });
  const avgRating = allReviews.length > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
    : 0;

  await Product.findByIdAndUpdate(review.product, {
    numOfReviews: allReviews.length,
    reviewsCount: allReviews.length,
    ratings: avgRating,
  });

  return successResponse(res, review, 'Review updated successfully');
});

/**
 * Report an inappropriate review
 * POST /api/reviews/:id/report
 */
const reportReview = asyncHandler(async (req, res) => {
  const { reason = 'Inappropriate content' } = req.body || {};
  const review = await Review.findById(req.params.id);

  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  review.isReported = true;
  review.reportReason = reason;
  review.reportCount = (review.reportCount || 0) + 1;
  if (review.reportCount >= 3) {
    review.status = 'flagged';
  }
  await review.save();

  return successResponse(res, null, 'Review has been reported for moderation');
});

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied', 403);
  }

  const productId = review.product;
  await review.deleteOne();

  // Recalculate product rating
  const remainingReviews = await Review.find({ product: productId, status: { $ne: 'hidden' } });
  const avgRating =
    remainingReviews.length > 0
      ? Math.round((remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length) * 10) / 10
      : 0;

  await Product.findByIdAndUpdate(productId, {
    numOfReviews: remainingReviews.length,
    reviewsCount: remainingReviews.length,
    ratings: avgRating,
  });

  return successResponse(res, null, 'Review removed successfully');
});

module.exports = {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  reportReview,
  deleteReview,
};
