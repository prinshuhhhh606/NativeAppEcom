const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { calculateCartTotals } = require('../utils/calculateOrder');

/**
 * Get current user's active cart
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price discountPrice discountPercent images stock isActive',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Filter out products that were removed/deactivated
  const validItems = cart.items.filter((item) => item.product && item.product.isActive);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  // Recalculate totals dynamically
  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      cartId: cart._id,
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
    },
    'Cart retrieved successfully'
  );
});

/**
 * Add an item to cart
 * POST /api/cart/add
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant = {} } = req.body;
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    return errorResponse(res, 'Quantity must be at least 1', 400);
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found or unavailable', 404);
  }

  if (product.stock < qty) {
    return errorResponse(res, `Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if product with identical variant already exists in cart
  const itemIndex = cart.items.findIndex((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = (item.variant?.size || '') === (variant?.size || '');
    const isSameColor = (item.variant?.color || '') === (variant?.color || '');
    return isSameProduct && isSameSize && isSameColor;
  });

  const effectivePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

  if (itemIndex > -1) {
    const newQty = cart.items[itemIndex].quantity + qty;
    if (product.stock < newQty) {
      return errorResponse(res, `Cannot add more. Maximum available stock is ${product.stock}`, 400);
    }
    cart.items[itemIndex].quantity = newQty;
    cart.items[itemIndex].price = effectivePrice;
  } else {
    cart.items.push({
      product: productId,
      quantity: qty,
      price: effectivePrice,
      variant: {
        size: variant.size || '',
        color: variant.color || '',
      },
    });
  }

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
    },
    'Product added to cart'
  );
});

/**
 * Update item quantity in cart
 * PUT /api/cart/item/:itemId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return errorResponse(res, 'Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
  if (itemIndex === -1) {
    return errorResponse(res, 'Item not found in cart', 404);
  }

  if (qty <= 0) {
    // Remove item if quantity is zero or less
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await Product.findById(cart.items[itemIndex].product);
    if (product && product.stock < qty) {
      return errorResponse(res, `Only ${product.stock} items available in stock`, 400);
    }
    cart.items[itemIndex].quantity = qty;
  }

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
    },
    'Cart updated successfully'
  );
});

/**
 * Remove an item from cart
 * DELETE /api/cart/item/:itemId
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return errorResponse(res, 'Cart not found', 404);
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
    },
    'Item removed from cart'
  );
});

/**
 * Clear all items from cart
 * DELETE /api/cart/clear
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.appliedCoupon = undefined;
    await cart.save();
  }

  return successResponse(res, { items: [], summary: calculateCartTotals([]) }, 'Cart cleared successfully');
});

/**
 * Apply coupon to cart
 * POST /api/cart/apply-coupon
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return errorResponse(res, 'Coupon code is required', 400);
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
  if (!coupon) {
    return errorResponse(res, 'Invalid coupon code', 404);
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    return errorResponse(res, 'This coupon has expired', 400);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return errorResponse(res, 'Coupon usage limit has been reached', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return errorResponse(res, 'Your cart is empty', 400);
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (subtotal < coupon.minOrderAmount) {
    return errorResponse(
      res,
      `Minimum order value of ₹${coupon.minOrderAmount} required to use coupon ${coupon.code}`,
      400
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  cart.appliedCoupon = {
    code: coupon.code,
    discountAmount: Math.round(discountAmount),
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
    },
    `Coupon "${coupon.code}" applied! You saved ₹${cart.appliedCoupon.discountAmount}`
  );
});

/**
 * Remove applied coupon
 * DELETE /api/cart/remove-coupon
 */
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.appliedCoupon = undefined;
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price discountPrice images stock',
    });
  }

  const cartSummary = calculateCartTotals(cart?.items || []);

  return successResponse(
    res,
    {
      items: cart?.items || [],
      appliedCoupon: null,
      summary: cartSummary,
    },
    'Coupon removed'
  );
});

/**
 * Merge guest cart items into authenticated user's cart
 * POST /api/cart/merge
 */
const mergeCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  if (!Array.isArray(items)) {
    return errorResponse(res, 'Items must be an array', 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  if (!cart.items) {
    cart.items = [];
  }

  const productIds = items
    .map((item) => item.productId || item.product?._id || item.product || item.id || item._id)
    .filter(Boolean);

  const existingProducts = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });
  const productMap = new Map(existingProducts.map((p) => [p._id.toString(), p]));

  const notifications = [];

  for (const guestItem of items) {
    const rawId = (guestItem.productId || guestItem.product?._id || guestItem.product || guestItem.id || guestItem._id)?.toString();
    const product = productMap.get(rawId);
    const itemName = guestItem.name || guestItem.productName || 'Product';

    if (!product) {
      notifications.push(`"${itemName}" is no longer available and was removed.`);
      continue;
    }

    if (product.stock <= 0) {
      notifications.push(`"${product.name || itemName}" is currently out of stock and was omitted.`);
      continue;
    }

    const guestQty = Math.max(1, parseInt(guestItem.quantity, 10) || 1);
    const variant = guestItem.selectedVariant || guestItem.variant || {};
    const size = (variant.size || '').toString();
    const color = (variant.color || '').toString();

    const effectivePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
    const guestPrice = Number(guestItem.price) || 0;
    if (guestPrice > 0 && Math.abs(guestPrice - effectivePrice) > 0.01) {
      notifications.push(`Price for "${product.name || itemName}" updated to ₹${effectivePrice}.`);
    }

    const existingIndex = cart.items.findIndex((item) => {
      const sameProd = (item.product?._id || item.product)?.toString() === rawId;
      const itemVar = item.selectedVariant || item.variant || {};
      const sameSize = (itemVar.size || '').toString() === size;
      const sameColor = (itemVar.color || '').toString() === color;
      return sameProd && sameSize && sameColor;
    });

    if (existingIndex > -1) {
      const requestedTotalQty = cart.items[existingIndex].quantity + guestQty;
      const newTotalQty = Math.min(product.stock, requestedTotalQty);
      if (newTotalQty < requestedTotalQty) {
        notifications.push(`Only ${product.stock} units of "${product.name || itemName}" available in stock.`);
      }
      cart.items[existingIndex].quantity = newTotalQty;
      cart.items[existingIndex].price = effectivePrice;
      cart.items[existingIndex].priceAtAddition = effectivePrice;
    } else {
      const addedQty = Math.min(product.stock, guestQty);
      if (addedQty < guestQty) {
        notifications.push(`Only ${product.stock} units of "${product.name || itemName}" available in stock.`);
      }
      if (addedQty > 0) {
        cart.items.push({
          product: product._id,
          quantity: addedQty,
          price: effectivePrice,
          priceAtAddition: effectivePrice,
          variant: { size, color },
          selectedVariant: { size, color },
        });
      }
    }
  }

  cart.products = cart.items;
  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name productName price discountPrice images stock isActive',
  });

  const cartSummary = calculateCartTotals(cart.items, cart.appliedCoupon);

  return successResponse(
    res,
    {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      summary: cartSummary,
      notifications,
    },
    'Cart items merged successfully'
  );
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
};

