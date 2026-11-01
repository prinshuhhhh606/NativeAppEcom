const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    select: 'name price discountPrice discountPercent images ratings numOfReviews stock inStock brand',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  return successResponse(res, wishlist.products, 'Wishlist fetched successfully');
});

/**
 * Add product to wishlist
 * POST /api/wishlist/add
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found', 404);
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate({
    path: 'products',
    select: 'name price discountPrice discountPercent images ratings stock brand',
  });

  return successResponse(res, wishlist.products, 'Product added to wishlist');
});

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/remove/:productId
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name price discountPrice discountPercent images ratings stock brand',
    });
  }

  return successResponse(res, wishlist?.products || [], 'Product removed from wishlist');
});

/**
 * Toggle product in wishlist (add if absent, remove if present)
 * POST /api/wishlist/toggle
 */
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return errorResponse(res, 'Product ID is required', 400);
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const existsIndex = wishlist.products.findIndex((p) => p.toString() === productId);
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
    select: 'name price discountPrice discountPercent images ratings stock brand',
  });

  return successResponse(
    res,
    {
      action,
      products: wishlist.products,
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

  // Find valid active products
  const validProducts = await Product.find({
    _id: { $in: productIds },
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
  await wishlist.populate({
    path: 'products',
    match: { isActive: true },
    select: 'productName name price originalPrice discountPrice discountPercent images ratings stock brand',
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

