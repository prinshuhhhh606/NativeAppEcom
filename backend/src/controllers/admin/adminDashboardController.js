const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Seller = require('../../models/Seller');
const DeliveryPartner = require('../../models/DeliveryPartner');
const SellerOrder = require('../../models/SellerOrder');
const Category = require('../../models/Category');
const ReturnRequest = require('../../models/ReturnRequest');
const Payment = require('../../models/Payment');
const Refund = require('../../models/Refund');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Comprehensive Real-Time Admin Dashboard Metrics
 * GET /api/v1/admin/dashboard
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const { timeframe = '30d', startDate, endDate } = req.query;

  // Determine date boundary
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let filterStartDate;
  if (startDate) {
    filterStartDate = new Date(startDate);
  } else if (timeframe === 'today') {
    filterStartDate = startOfToday;
  } else if (timeframe === '7d') {
    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '30d') {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'this_month') {
    filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // 1. Parallel Overview Aggregations
  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers,
    todayCustomers,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCategories,
    refundRequestsCount,
    revenueAgg,
    todayRevenueAgg,
    recentOrders,
    recentCustomers,
    recentTransactions,
    totalSellers,
    pendingSellers,
    totalRiders,
    pendingRiders,
    sellerFinanceAgg,
    riderWalletAgg,
    refundsAgg,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed'] } }),
    Order.countDocuments({ orderStatus: { $in: ['Processing', 'Packed'] } }),
    Order.countDocuments({ orderStatus: { $in: ['Shipped', 'OutForDelivery'] } }),
    Order.countDocuments({ orderStatus: 'Delivered' }),
    Order.countDocuments({ orderStatus: 'Cancelled' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfToday } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 10 } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    Category.countDocuments({ isActive: true }),
    ReturnRequest.countDocuments({ status: 'Pending' }),
    // Total Revenue (excluding cancelled)
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } },
    ]),
    // Today's Revenue
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' }, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } },
    ]),
    // Recent 6 Orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderId shippingAddress.fullName pricing.grandTotal orderStatus paymentMethod createdAt'),
    // Recent 5 Customers
    User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email phone avatar createdAt'),
    // Recent 5 Payments
    Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('order', 'orderId'),
    // Sellers & Riders
    Seller.countDocuments({ status: 'approved' }),
    Seller.countDocuments({ status: { $in: ['pending_verification', 'under_review'] } }),
    DeliveryPartner.countDocuments({ kycStatus: 'approved' }),
    DeliveryPartner.countDocuments({ kycStatus: { $in: ['pending', 'under_review'] } }),
    // Platform Commission & Seller Earnings
    SellerOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          gmv: { $sum: '$subtotal' },
          commission: { $sum: '$commissionAmount' },
          sellerPayable: { $sum: '$netEarnings' },
        },
      },
    ]),
    // Rider Available Balance
    DeliveryPartner.aggregate([
      { $group: { _id: null, totalRiderBalance: { $sum: '$earnings.available' } } },
    ]),
    // Refunds
    Refund.aggregate([
      { $match: { status: 'Processed' } },
      { $group: { _id: null, totalRefunded: { $sum: '$amount' } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const todayRevenue = todayRevenueAgg[0]?.total || 0;
  const platformCommission = sellerFinanceAgg[0]?.commission || 0;
  const sellerPayable = sellerFinanceAgg[0]?.sellerPayable || 0;
  const riderPayable = riderWalletAgg[0]?.totalRiderBalance || 0;
  const totalRefunds = refundsAgg[0]?.totalRefunded || 0;

  // 2. Revenue & Orders Time-Series Analytics (Aggregated by Day)
  const chartAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: filterStartDate },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Format chart data with full dates
  const salesChart = chartAgg.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders,
  }));

  // 3. Best Selling Products
  const bestSellersAgg = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'Cancelled' } } },
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
  ]);

  // 4. Low-stock products list for alert widget
  const lowStockList = await Product.find({ isActive: true, stock: { $lte: 10 } })
    .select('name sku stock price images category')
    .populate('category', 'name')
    .sort({ stock: 1 })
    .limit(8);

  return successResponse(
    res,
    {
      overview: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        todayCustomers,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories,
        refundRequestsCount,
        totalSellers,
        pendingSellers,
        totalRiders,
        pendingRiders,
        platformCommission,
        sellerPayable,
        riderPayable,
        totalRefunds,
      },
      analytics: {
        salesChart,
        bestSellers: bestSellersAgg,
        orderStatusDistribution: [
          { name: 'Pending', value: pendingOrders, color: '#f59e0b' },
          { name: 'Processing', value: processingOrders, color: '#3b82f6' },
          { name: 'Shipped', value: shippedOrders, color: '#8b5cf6' },
          { name: 'Delivered', value: deliveredOrders, color: '#10b981' },
          { name: 'Cancelled', value: cancelledOrders, color: '#ef4444' },
        ],
      },
      recentOrders,
      recentCustomers,
      recentTransactions,
      lowStockList,
    },
    'Admin dashboard metrics retrieved successfully'
  );
});

module.exports = {
  getDashboardMetrics,
};

