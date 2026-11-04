/**
 * Seller Dashboard Analytics Controller
 */
const Product = require('../../models/Product');
const SellerOrder = require('../../models/SellerOrder');
const Seller = require('../../models/Seller');
const Payout = require('../../models/Payout');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Comprehensive Real-Time Seller Dashboard Metrics
 * GET /api/v1/seller/dashboard
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { timeframe = '30d' } = req.query;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let filterStartDate;
  if (timeframe === 'today') {
    filterStartDate = startOfToday;
  } else if (timeframe === '7d') {
    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'this_month') {
    filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // 1. Parallel Aggregations for Seller
  const [
    totalProducts,
    activeProducts,
    pendingProducts,
    rejectedProducts,
    lowStockProducts,
    outOfStockProducts,
    recentProducts,
    totalOrders,
    newOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    readyToShipOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    returnedOrders,
    todayOrders,
    totalSalesAgg,
    todaySalesAgg,
    timeframeSalesAgg,
    recentOrders,
    bestSellersAgg,
    payoutStatsAgg,
    currentSeller,
  ] = await Promise.all([
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({ seller: sellerId, isActive: true, approvalStatus: 'approved' }),
    Product.countDocuments({ seller: sellerId, approvalStatus: { $in: ['pending', 'pending_approval'] } }),
    Product.countDocuments({ seller: sellerId, approvalStatus: 'rejected' }),
    Product.countDocuments({ seller: sellerId, isActive: true, stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ seller: sellerId, stock: 0 }),
    Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('productName subtitle sku stock price originalPrice images approvalStatus isActive createdAt'),

    SellerOrder.countDocuments({ seller: sellerId }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['new', 'pending'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['pending', 'new'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['confirmed', 'accepted'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['processing', 'packing', 'packed'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['ready_to_ship', 'ready_for_pickup', 'pickup_scheduled'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['shipped', 'in_transit', 'out_for_delivery'] } }),
    SellerOrder.countDocuments({ seller: sellerId, status: 'delivered' }),
    SellerOrder.countDocuments({ seller: sellerId, status: { $in: ['cancelled', 'rejected'] } }),
    SellerOrder.countDocuments({
      seller: sellerId,
      status: {
        $in: [
          'return_requested',
          'return_approved',
          'return_rejected',
          'return_pickup',
          'returned',
          'refund_processing',
          'refunded',
          'exchange_requested',
        ],
      },
    }),
    SellerOrder.countDocuments({ seller: sellerId, createdAt: { $gte: startOfToday } }),

    // Lifetime sales
    SellerOrder.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$subtotal' }, netEarnings: { $sum: '$netEarnings' }, commission: { $sum: '$commissionAmount' } } },
    ]),

    // Today sales
    SellerOrder.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, todaySales: { $sum: '$subtotal' }, todayNet: { $sum: '$netEarnings' } } },
    ]),

    // Timeframe sales for chart
    SellerOrder.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: filterStartDate }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$subtotal' },
          netEarnings: { $sum: '$netEarnings' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Recent 5 orders
    SellerOrder.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subOrderNumber orderNumber customerName subtotal netEarnings status paymentMethod createdAt items itemCount'),

    // Top selling products
    SellerOrder.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),

    // Payout stats
    Payout.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),

    Seller.findById(sellerId).select('balance commissionRate status'),
  ]);

  const lifetime = totalSalesAgg[0] || { totalSales: 0, netEarnings: 0, commission: 0 };
  const today = todaySalesAgg[0] || { todaySales: 0, todayNet: 0 };

  const salesChart = timeframeSalesAgg.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    netEarnings: item.netEarnings,
    orders: item.orders,
  }));

  // Fetch low-stock products list
  const lowStockList = await Product.find({ seller: sellerId, isActive: true, stock: { $lte: 5 } })
    .select('productName sku stock price images')
    .sort({ stock: 1 })
    .limit(6);

  return successResponse(
    res,
    {
      overview: {
        totalProducts,
        activeProducts,
        publishedProducts: activeProducts,
        pendingProducts,
        rejectedProducts,
        lowStockProducts,
        outOfStockProducts,
        totalOrders,
        newOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        readyToShipOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        todayOrders,
        grossSales: lifetime.totalSales,
        netEarnings: lifetime.netEarnings,
        platformCommission: lifetime.commission,
        todaySales: today.todaySales,
        todayNetEarnings: today.todayNet,
        availableBalance: currentSeller?.balance?.available || 0,
        pendingBalance: currentSeller?.balance?.pending || 0,
        commissionRate: currentSeller?.commissionRate || 10,
        sellerStatus: currentSeller?.status,
        isApproved: currentSeller?.status === 'approved',
      },
      recentProducts,
      salesChart,
      recentOrders,
      bestSellers: bestSellersAgg,
      lowStockList,
      payoutStats: payoutStatsAgg,
    },
    'Seller dashboard metrics retrieved'
  );
});

module.exports = {
  getDashboardMetrics,
};

