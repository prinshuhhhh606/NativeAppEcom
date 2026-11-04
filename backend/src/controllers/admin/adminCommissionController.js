const StoreSetting = require('../../models/StoreSetting');
const Category = require('../../models/Category');
const SellerOrder = require('../../models/SellerOrder');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * 1. Get Commission Rules & Summary
 * GET /api/v1/admin/commissions
 */
const getCommissionSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = await StoreSetting.create({});
  }

  const [categories, aggregateStats] = await Promise.all([
    Category.find({ isActive: true }).select('name commissionPercentage slug').lean(),
    SellerOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$subtotal' },
          totalCommissionEarned: { $sum: '$commissionAmount' },
          totalSellerPayouts: { $sum: '$netEarnings' },
        },
      },
    ]),
  ]);

  const stats = aggregateStats[0] || {
    totalSales: 0,
    totalCommissionEarned: 0,
    totalSellerPayouts: 0,
  };

  return successResponse(
    res,
    {
      commissions: settings.commissions || {
        defaultSellerCommission: 10,
        defaultFranchiseCommission: 3.5,
        defaultDeliveryPartnerFee: 65,
        minimumDeliveryCharge: 40,
        platformCommission: 5,
      },
      categories,
      stats,
    },
    'Commission configuration retrieved successfully'
  );
});

/**
 * 2. Update Global Commission Configuration
 * PUT /api/v1/admin/commissions
 */
const updateCommissionSettings = asyncHandler(async (req, res) => {
  const {
    defaultSellerCommission,
    defaultFranchiseCommission,
    defaultDeliveryPartnerFee,
    minimumDeliveryCharge,
    platformCommission,
  } = req.body;

  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = new StoreSetting({});
  }

  if (!settings.commissions) {
    settings.commissions = {};
  }

  if (defaultSellerCommission !== undefined) {
    settings.commissions.defaultSellerCommission = Number(defaultSellerCommission);
  }
  if (defaultFranchiseCommission !== undefined) {
    settings.commissions.defaultFranchiseCommission = Number(defaultFranchiseCommission);
  }
  if (defaultDeliveryPartnerFee !== undefined) {
    settings.commissions.defaultDeliveryPartnerFee = Number(defaultDeliveryPartnerFee);
  }
  if (minimumDeliveryCharge !== undefined) {
    settings.commissions.minimumDeliveryCharge = Number(minimumDeliveryCharge);
  }
  if (platformCommission !== undefined) {
    settings.commissions.platformCommission = Number(platformCommission);
  }

  await settings.save();

  // Audit log
  if (req.admin) {
    try {
      await AuditLog.create({
        admin: req.admin._id,
        adminName: req.admin.name || 'Admin',
        adminEmail: req.admin.email || '',
        action: 'COMMISSION_SETTINGS_UPDATED',
        module: 'commissions',
        details: settings.commissions,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (e) {}
  }

  return successResponse(res, settings.commissions, 'Commission settings updated successfully');
});

/**
 * 3. Update Category Specific Commission Rate
 * PATCH /api/v1/admin/commissions/category/:id
 */
const updateCategoryCommission = asyncHandler(async (req, res) => {
  const rate = req.body.commissionPercentage !== undefined ? req.body.commissionPercentage : req.body.commissionRate;
  if (rate === undefined || rate < 0 || rate > 100) {
    return errorResponse(res, 'Valid commission percentage (0-100) is required', 400);
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $set: { commissionPercentage: Number(rate) } },
    { new: true }
  );

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  return successResponse(res, category, `Commission for category ${category.name} updated to ${rate}%`);
});

/**
 * 4. Get Order-by-Order Commission Breakdown Report
 * GET /api/v1/admin/commissions/ledger
 */
const getCommissionLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [orders, total] = await Promise.all([
    SellerOrder.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('seller', 'storeName ownerName phone email')
      .populate('order', 'orderId orderNumber paymentMethod paymentStatus')
      .lean(),
    SellerOrder.countDocuments(),
  ]);

  const ledger = orders.map((o) => ({
    orderId: o.order?.orderId || o.orderNumber,
    sellerName: o.seller?.storeName || o.sellerStoreName || 'Merchant',
    subtotal: o.subtotal,
    commissionRate: `${o.commissionRate || 10}%`,
    commissionEarned: o.commissionAmount,
    netPayableToSeller: o.netEarnings,
    status: o.status,
    createdAt: o.createdAt,
  }));

  return successResponse(res, ledger, 'Commission ledger retrieved successfully', 200, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

module.exports = {
  getCommissionSettings,
  updateCommissionSettings,
  updateCategoryCommission,
  getCommissionLedger,
};
