const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const POPULATE_FIELDS = 'productName name price originalPrice discountPrice discountPercent images ratings numReviews numOfReviews stock inStock brand slug';

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    select: POPULATE_FIELDS,
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const cleanedProducts = (wishlist.products || []).filter((p) => p !== null);
  return successResponse(res, cleanedProducts, 'Wishlist fetched successfully');
});

/**
 * Add product to wishlist
 * POST /api/wishlist/add
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId.toString())) {
    return errorResponse(res, 'Valid product ID is required', 400);
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found or inactive', 404);
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const strId = productId.toString();
  if (!wishlist.products.some((id) => id.toString() === strId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate({
    path: 'products',
    select: POPULATE_FIELDS,
  });

  const cleanedProducts = (wishlist.products || []).filter((p) => p !== null);
  return successResponse(res, cleanedProducts, 'Product added to wishlist');
});

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/remove/:productId
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    const strId = (productId || '').toString();
    wishlist.products = wishlist.products.filter((id) => id.toString() !== strId);
    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: POPULATE_FIELDS,
    });
  }

  const cleanedProducts = (wishlist?.products || []).filter((p) => p !== null);
  return successResponse(res, cleanedProducts, 'Product removed from wishlist');
});

/**
 * Toggle product in wishlist (add if absent, remove if present)
 * POST /api/wishlist/toggle
 */
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId || !mongoose.Types.ObjectId.isValid(productId.toString())) {
    return errorResponse(res, 'Valid product ID is required', 400);
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const strId = productId.toString();
  const existsIndex = wishlist.products.findIndex((p) => p.toString() === strId);
  let action = 'added';

  if (existsIndex > -1) {
    wishlist.products.splice(existsIndex, 1);
    action = 'removed';
  } else {
    wishlist.products.push(productId);
    action = 'added';
  }

  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    select: POPULATE_FIELDS,
  });

  const cleanedProducts = (wishlist.products || []).filter((p) => p !== null);
  return successResponse(
    res,
    {
      action,
      products: cleanedProducts,
      isWishlisted: action === 'added',
    },
    `Product ${action} from wishlist`
  );
});

/**
 * Move item from wishlist to cart
 * POST /api/wishlist/move-to-cart/:productId
 */
const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Add to cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const effectivePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += 1;
  } else {
    cart.items.push({ product: productId, quantity: 1, price: effectivePrice });
  }
  await cart.save();

  // Remove from wishlist
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();
  }

  return successResponse(res, null, 'Moved product to cart successfully');
});

/**
 * Sync guest wishlist products with user account upon login
 * POST /api/wishlist/sync
 */
const syncWishlist = asyncHandler(async (req, res) => {
  const { productIds = [] } = req.body;
  if (!Array.isArray(productIds)) {
    return errorResponse(res, 'productIds must be an array', 400);
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  // Filter only valid MongoDB ObjectIds to prevent CastErrors
  const validObjectIds = productIds.filter(
    (id) => id && mongoose.Types.ObjectId.isValid(id.toString())
  );

  if (validObjectIds.length > 0) {
    const validProducts = await Product.find({
      _id: { $in: validObjectIds },
      isActive: true,
    }).select('_id');

    const validIds = validProducts.map((p) => p._id.toString());
    const existingSet = new Set(wishlist.products.map((p) => p.toString()));

    validIds.forEach((id) => {
      if (!existingSet.has(id)) {
        wishlist.products.push(id);
        existingSet.add(id);
      }
    });

    await wishlist.save();
  }

  await wishlist.populate({
    path: 'products',
    match: { isActive: true },
    select: POPULATE_FIELDS,
  });

  const cleanedProducts = (wishlist.products || []).filter((p) => p !== null);

  return successResponse(res, cleanedProducts, 'Wishlist synced successfully');
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  moveToCart,
  syncWishlist,
};

