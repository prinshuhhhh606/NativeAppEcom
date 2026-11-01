const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get available coupons
 * GET /api/coupons
 */
const getAllCoupons = asyncHandler(async (req, res) => {
  const query = req.user?.role === 'admin' ? {} : { isActive: true, expiryDate: { $gt: new Date() } };
  const coupons = await Coupon.find(query).sort({ expiryDate: 1 });

  return successResponse(res, coupons, 'Coupons fetched successfully');
});

/**
 * Validate a coupon code for a given cart subtotal
 * POST /api/coupons/validate
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartAmount } = req.body;

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

  const amount = Number(cartAmount) || 0;
  if (amount < coupon.minOrderAmount) {
    return errorResponse(
      res,
      `Minimum order value of ₹${coupon.minOrderAmount} required for coupon ${coupon.code}`,
      400
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, amount);
  }

  return successResponse(
    res,
    {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount),
      description: coupon.description,
      minOrderAmount: coupon.minOrderAmount,
    },
    `Coupon applied! You save ₹${Math.round(discountAmount)}`
  );
});

/**
 * [Admin] Create coupon
 * POST /api/coupons
 */
const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } =
    req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    return errorResponse(res, 'Coupon with this code already exists', 400);
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description,
    discountType,
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
    expiryDate: new Date(expiryDate),
    usageLimit: usageLimit ? Number(usageLimit) : undefined,
  });

  return successResponse(res, coupon, 'Coupon created successfully', 201);
});

/**
 * [Admin] Delete coupon
 * DELETE /api/coupons/:id
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  return successResponse(res, null, 'Coupon deleted successfully');
});

module.exports = {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  deleteCoupon,
};

