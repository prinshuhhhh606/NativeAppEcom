/**
 * Seller Customer Reviews Controller
 */
const Review = require('../../models/Review');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List Customer Reviews for Seller's Products
 * GET /api/v1/seller/reviews
 */
const getSellerReviews = asyncHandler(async (req, res) => {
  const sellerProducts = await Product.find({ seller: req.seller._id }).select('_id productName images ratings');
  const productIds = sellerProducts.map((p) => p._id);

  const reviews = await Review.find({ product: { $in: productIds } })
    .populate('user', 'name')
    .populate('product', 'productName images ratings')
    .sort({ createdAt: -1 })
    .limit(50);

  return successResponse(res, reviews, 'Customer reviews fetched');
});

/**
 * Reply to Customer Review
 * POST /api/v1/seller/reviews/:id/reply
 */
const replyToReview = asyncHandler(async (req, res) => {
  const { replyText } = req.body || {};
  if (!replyText || !replyText.trim()) {
    return errorResponse(res, 'Reply text cannot be empty', 400);
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  // Ensure product belongs to seller
  const product = await Product.findOne({ _id: review.product, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Access denied: You do not own this reviewed product', 403);
  }

  review.sellerReply = {
    message: replyText.trim(),
    repliedAt: new Date(),
  };

  await review.save();

  return successResponse(res, review, 'Reply posted successfully');
});

module.exports = {
  getSellerReviews,
  replyToReview,
};

