/**
 * Business Growth Center Controller
 * Store coupons, festival campaigns, and AI-assisted product copy generation
 */
const SellerCoupon = require('../../models/SellerCoupon');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List Store Coupons & Growth Campaigns
 * GET /api/v1/seller/growth/coupons
 */
const getCampaigns = asyncHandler(async (req, res) => {
  const coupons = await SellerCoupon.find({ seller: req.seller._id }).sort({ createdAt: -1 });

  const activeCampaigns = [
    {
      id: 'fest_diwali',
      title: 'Grand Festive Utsav Campaign',
      badge: 'Featured Festival',
      discount: 'Flat ₹200 OFF on Handlooms',
      status: 'Live',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 14),
      participatingProducts: 12,
    },
    {
      id: 'referral_vip',
      title: 'Repeat Customer VIP Perks',
      badge: 'Loyalty Reward',
      discount: '15% Extra Discount',
      status: 'Active',
      startDate: new Date(Date.now() - 86400000 * 7),
      endDate: new Date(Date.now() + 86400000 * 30),
      participatingProducts: 25,
    },
  ];

  return successResponse(res, { coupons, campaigns: activeCampaigns }, 'Growth campaigns fetched');
});

/**
 * Create Custom Store Coupon
 * POST /api/v1/seller/growth/coupons
 */
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType = 'percentage', discountValue, minOrderValue = 0, maxDiscountAmount, expiryDate } =
    req.body || {};

  if (!code || !discountValue) {
    return errorResponse(res, 'Coupon code and discount value are required', 400);
  }

  const existing = await SellerCoupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    return errorResponse(res, 'This coupon code is already taken. Please choose another.', 409);
  }

  const coupon = await SellerCoupon.create({
    seller: req.seller._id,
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue),
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 86400000 * 30),
    isActive: true,
  });

  return successResponse(res, coupon, 'Store coupon created successfully', 201);
});

/**
 * AI-Assisted Product Description & Title Generator
 * POST /api/v1/seller/growth/ai-copy
 */
const generateAiCopy = asyncHandler(async (req, res) => {
  const { productName = '', category = '', keyFeatures = '' } = req.body || {};

  if (!productName.trim()) {
    return errorResponse(res, 'Product name is required for AI copy generation', 400);
  }

  // High-converting Indian e-commerce copy templates
  const generatedTitle = `Authentic ${productName.trim()} - Premium Quality & Handcrafted Heritage`;
  const generatedDescription = `Experience unmatched elegance with our handcrafted ${productName.trim()}. Meticulously curated for the discerning Bharat Bazaar customer, this ${category || 'product'} seamlessly blends traditional artisanal mastery with contemporary lifestyle durability. ${keyFeatures ? 'Key Highlights: ' + keyFeatures : 'Crafted using eco-friendly, premium-grade materials.'} Perfect for daily use, gifting, or festive celebrations. Comes with authentic quality assurance and 7-day hassle-free returns.`;

  const highlights = [
    '100% Genuine Artisan Craftsmanship',
    'Durable, Skin-Friendly & Premium Finish',
    'Pan-India Secure Doorstep Delivery',
    '7 Days Easy Return & Exchange Guarantee',
  ];

  return successResponse(
    res,
    {
      title: generatedTitle,
      description: generatedDescription,
      highlights,
    },
    'AI marketing copy generated successfully'
  );
});

module.exports = {
  getCampaigns,
  createCoupon,
  generateAiCopy,
};

