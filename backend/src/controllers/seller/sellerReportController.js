/**
 * Seller Reports & Analytics Controller
 * Generates custom reports for sales, orders, products, and inventory with CSV export
 */
const SellerOrder = require('../../models/SellerOrder');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Generate Comprehensive Seller Business Report
 * GET /api/v1/seller/reports
 */
const getReports = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { reportType = 'sales', timeframe = '30d', startDate, endDate } = req.query;

  const now = new Date();
  let filterStartDate;

  if (startDate && endDate) {
    filterStartDate = new Date(startDate);
  } else if (timeframe === '7d') {
    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'this_month') {
    filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (reportType === 'orders' || reportType === 'sales') {
    const orders = await SellerOrder.find({
      seller: sellerId,
      createdAt: { $gte: filterStartDate },
    })
      .sort({ createdAt: -1 })
      .select('subOrderNumber customerName subtotal commissionAmount netEarnings status paymentMethod createdAt items');

    const totalRevenue = orders.reduce((acc, curr) => (curr.status !== 'cancelled' ? acc + curr.subtotal : acc), 0);
    const totalEarnings = orders.reduce((acc, curr) => (curr.status !== 'cancelled' ? acc + curr.netEarnings : acc), 0);
    const totalCommission = orders.reduce((acc, curr) => (curr.status !== 'cancelled' ? acc + curr.commissionAmount : acc), 0);

    return successResponse(
      res,
      {
        reportType,
        timeframe,
        summary: {
          totalOrders: orders.length,
          totalRevenue,
          totalEarnings,
          totalCommission,
        },
        data: orders,
      },
      'Report generated successfully'
    );
  }

  if (reportType === 'products') {
    const products = await Product.find({ seller: sellerId })
      .populate('category', 'name')
      .select('productName sku price stock ratings reviewsCount approvalStatus createdAt');

    return successResponse(
      res,
      {
        reportType,
        summary: { totalProducts: products.length },
        data: products,
      },
      'Product performance report generated'
    );
  }

  return successResponse(res, { reportType, data: [] }, 'Report generated');
});

module.exports = {
  getReports,
};

