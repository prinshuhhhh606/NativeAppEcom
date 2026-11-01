const Coupon = require('../../models/Coupon');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');

/**
 * List all coupons
 * GET /api/v1/admin/coupons
 */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return successResponse(res, coupons, 'Coupons retrieved successfully');
});

/**
 * Create a new coupon
 * POST /api/v1/admin/coupons
 */
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    expiryDate,
    usageLimit,
    isActive = true,
  } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    return errorResponse(res, `Coupon code "${code.toUpperCase()}" already exists`, 400);
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
    isActive: isActive === 'true' || isActive === true,
  });

  recordAuditLog(req, 'COUPON_CREATED', 'coupons', coupon._id, { code: coupon.code });

  return successResponse(res, coupon, 'Coupon created successfully', 201);
});

/**
 * Update coupon
 * PUT /api/v1/admin/coupons/:id
 */
const updateCoupon = asyncHandler(async (req, res) => {
  let coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  if (req.body.code) {
    req.body.code = req.body.code.toUpperCase().trim();
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  recordAuditLog(req, 'COUPON_UPDATED', 'coupons', coupon._id, { code: coupon.code });

  return successResponse(res, coupon, 'Coupon updated successfully');
});

/**
 * Toggle Coupon Active Status
 * PATCH /api/v1/admin/coupons/:id/toggle
 */
const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  recordAuditLog(req, 'COUPON_TOGGLE', 'coupons', coupon._id, { code: coupon.code, isActive: coupon.isActive });

  return successResponse(res, coupon, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`);
});

/**
 * Delete coupon
 * DELETE /api/v1/admin/coupons/:id
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  recordAuditLog(req, 'COUPON_DELETED', 'coupons', coupon._id, { code: coupon.code });

  return successResponse(res, null, 'Coupon deleted successfully');
});

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
};

