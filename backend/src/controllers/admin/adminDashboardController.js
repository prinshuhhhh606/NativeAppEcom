const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Seller = require('../../models/Seller');
const DeliveryPartner = require('../../models/DeliveryPartner');
const Delivery = require('../../models/Delivery');
const DeliveryAssignment = require('../../models/DeliveryAssignment');
const SellerOrder = require('../../models/SellerOrder');
const Category = require('../../models/Category');
const ReturnRequest = require('../../models/ReturnRequest');
const Payment = require('../../models/Payment');
const Refund = require('../../models/Refund');
const Payout = require('../../models/Payout');
const DeliveryPayout = require('../../models/DeliveryPayout');
const Franchise = require('../../models/Franchise');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Comprehensive Real-Time Admin Dashboard Metrics
 * GET /api/v1/admin/dashboard
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const { timeframe = '30d', filterType = 'monthly' } = req.query;

  // Determine date boundaries
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let filterStartDate;
  if (timeframe === 'today' || filterType === 'daily') {
    filterStartDate = startOfToday;
  } else if (timeframe === '7d' || filterType === 'weekly') {
    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '30d' || filterType === 'monthly') {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '1y' || filterType === 'yearly') {
    filterStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else {
    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // 1. Parallel Overview Aggregations (18 KPIs)
  const [
    // Revenue
    revenueAgg,
    todayRevenueAgg,
    // Orders by status
    totalOrders,
    pendingOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    // Customers
    totalCustomers,
    activeCustomers,
    // Sellers
    totalSellers,
    activeSellers,
    // Franchises
    totalFranchises,
    // Delivery Fleet
    totalDeliveryBoys,
    activeDeliveryBoys,
    pendingDeliveryRequests,
    // Financials: Commission, Payouts, Refunds
    sellerFinanceAgg,
    pendingSellerPayouts,
    pendingRiderPayouts,
    refundRequestsCount,
    // Recent feeds
    recentOrders,
    recentRegistrations,
    recentTransactions,
    // Live Deliveries
    liveActiveDeliveries,
  ] = await Promise.all([
    // Total Revenue (excluding cancelled)
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ['$totalAmount', { $ifNull: ['$pricing.grandTotal', 0] }],
            },
          },
        },
      },
    ]),
    // Today's Revenue
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' }, createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ['$totalAmount', { $ifNull: ['$pricing.grandTotal', 0] }],
            },
          },
        },
      },
    ]),
    // Orders
    Order.countDocuments(),
    Order.countDocuments({
      orderStatus: { $in: ['Placed', 'Pending', 'Confirmed', 'Accepted', 'seller_accepted', 'Preparing', 'preparing'] },
    }),
    Order.countDocuments({
      orderStatus: {
        $in: [
          'ready_for_pickup',
          'Ready for Pickup',
          'pickup_scheduled',
          'delivery_partner_assigned',
          'picked_up',
          'Picked Up',
          'Shipped',
          'shipped',
          'in_transit',
          'out_for_delivery',
          'OutForDelivery',
          'reached_customer',
        ],
      },
    }),
    Order.countDocuments({ orderStatus: { $in: ['Delivered', 'delivered', 'completed'] } }),
    Order.countDocuments({ orderStatus: { $in: ['Cancelled', 'cancelled', 'Rejected', 'rejected'] } }),
    // Customers
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', isActive: true }),
    // Sellers
    Seller.countDocuments(),
    Seller.countDocuments({ status: 'approved', isActive: true }),
    // Franchises
    Franchise.countDocuments(),
    // Delivery Fleet
    DeliveryPartner.countDocuments(),
    DeliveryPartner.countDocuments({ isAvailable: true, kycStatus: 'approved' }),
    DeliveryAssignment.countDocuments({ status: 'requested' }),
    // Total Commission from SellerOrders
    SellerOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalCommission: { $sum: '$commissionAmount' } } },
    ]),
    // Pending Seller Payouts
    Payout.countDocuments({ status: { $in: ['pending', 'requested'] } }),
    // Pending Rider Payouts
    DeliveryPayout.countDocuments({ status: { $in: ['pending', 'requested'] } }),
    // Refund Requests
    ReturnRequest.countDocuments({ status: { $in: ['Pending', 'requested'] } }),
    // Recent 6 Orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderId orderNumber deliveryAddress shippingAddress totalAmount pricing orderStatus paymentMethod createdAt')
      .lean(),
    // Recent 5 Customer Registrations
    User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName name email phone mobileNumber avatar createdAt isActive')
      .lean(),
    // Recent 5 Transactions / Payments
    Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('order', 'orderId orderNumber')
      .lean(),
    // Live Active Deliveries (with coordinates)
    Delivery.find({
      status: { $in: ['assigned', 'reached_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'reached_customer'] },
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating currentLocation')
      .populate('order', 'orderId orderNumber deliveryAddress')
      .lean(),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const todayRevenue = todayRevenueAgg[0]?.total || 0;
  const totalCommission = sellerFinanceAgg[0]?.totalCommission || 0;
  const pendingPayouts = pendingSellerPayouts + pendingRiderPayouts;

  // 2. Revenue & Orders Time-Series Analytics
  const chartAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: filterStartDate },
        orderStatus: { $nin: ['Cancelled', 'cancelled', 'Rejected', 'rejected'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: {
          $sum: { $ifNull: ['$totalAmount', { $ifNull: ['$pricing.grandTotal', 0] }] },
        },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const salesChart = chartAgg.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders,
  }));

  // 3. Customer Growth Time-Series
  const customerGrowthAgg = await User.aggregate([
    {
      $match: {
        role: 'customer',
        createdAt: { $gte: filterStartDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newCustomers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 4. Top Selling Products
  const bestSellersAgg = await Order.aggregate([
    { $match: { orderStatus: { $nin: ['Cancelled', 'cancelled'] } } },
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
    { $limit: 6 },
  ]);

  // 5. Top Performing Sellers
  const topSellersAgg = await SellerOrder.aggregate([
    { $match: { status: { $nin: ['cancelled', 'rejected'] } } },
    {
      $group: {
        _id: '$seller',
        storeName: { $first: '$sellerStoreName' },
        ordersCount: { $sum: 1 },
        totalSales: { $sum: '$subtotal' },
        commissionGenerated: { $sum: '$commissionAmount' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 },
  ]);

  // 6. Delivery Performance Analytics
  const topRiders = await DeliveryPartner.find({ kycStatus: 'approved' })
    .sort({ 'earnings.totalDeliveries': -1 })
    .limit(5)
    .select('name phone vehicleType rating earnings isAvailable')
    .lean();

  return successResponse(
    res,
    {
      overview: {
        // The 18 Dashboard overview cards:
        totalRevenue,
        todayRevenue,
        totalOrders,
        pendingOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalCustomers,
        activeCustomers,
        totalSellers,
        activeSellers,
        totalFranchises,
        totalDeliveryBoys,
        activeDeliveryBoys,
        pendingDeliveryRequests,
        totalCommission,
        pendingPayouts,
        refundRequests: refundRequestsCount,
      },
      analytics: {
        salesChart,
        customerGrowth: customerGrowthAgg.map((c) => ({ date: c._id, count: c.newCustomers })),
        bestSellers: bestSellersAgg,
        topSellers: topSellersAgg,
        topRiders,
        orderStatusDistribution: [
          { name: 'Completed', value: completedOrders, color: '#10B981' },
          { name: 'Active', value: activeOrders, color: '#6366F1' },
          { name: 'Pending', value: pendingOrders, color: '#F59E0B' },
          { name: 'Cancelled', value: cancelledOrders, color: '#EF4444' },
        ],
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        orderId: o.orderId || o.orderNumber,
        customerName: o.deliveryAddress?.fullName || o.shippingAddress?.fullName || 'Customer',
        amount: o.totalAmount || o.pricing?.grandTotal || 0,
      })),
      recentCustomers: recentRegistrations || [],
      recentTransactions,
      liveActiveDeliveries: liveActiveDeliveries.map((d) => ({
        _id: d._id,
        orderNumber: d.order?.orderId || d.orderNumber || d.order?.orderNumber,
        partnerName: d.deliveryPartner?.name || 'Rider',
        partnerPhone: d.deliveryPartner?.phone || '',
        vehicle: `${d.deliveryPartner?.vehicleType || 'Bike'} (${d.deliveryPartner?.vehicleNumber || ''})`,
        status: d.status,
        latitude: d.currentLocation?.latitude || d.deliveryPartner?.currentLocation?.latitude,
        longitude: d.currentLocation?.longitude || d.deliveryPartner?.currentLocation?.longitude,
        updatedAt: d.currentLocation?.updatedAt || d.updatedAt,
      })),
    },
    'Super Admin dashboard metrics retrieved successfully'
  );
});

module.exports = {
  getDashboardMetrics,
};
