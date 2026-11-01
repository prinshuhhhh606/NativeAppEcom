const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Inventory = require('../../models/Inventory');
const Payment = require('../../models/Payment');
const SearchAnalytics = require('../../models/SearchAnalytics');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Comprehensive Sales & Revenue Report with Aggregations
 * GET /api/v1/admin/reports/sales
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const match = { orderStatus: { $ne: 'Cancelled' } };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  // Daily Breakdown
  const dailyReport = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalOrders: { $sum: 1 },
        grossSales: { $sum: '$pricing.subtotal' },
        discounts: { $sum: '$pricing.discount' },
        shippingCharges: { $sum: '$pricing.shipping' },
        taxes: { $sum: '$pricing.gst' },
        netRevenue: { $sum: '$pricing.grandTotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Overall Summary
  const summaryAgg = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.grandTotal' },
        totalDiscountGiven: { $sum: '$pricing.discount' },
        totalShippingCollected: { $sum: '$pricing.shipping' },
        totalTaxCollected: { $sum: '$pricing.gst' },
      },
    },
  ]);

  return successResponse(
    res,
    {
      summary: summaryAgg[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalDiscountGiven: 0,
        totalShippingCollected: 0,
        totalTaxCollected: 0,
      },
      dailyReport,
    },
    'Sales report retrieved'
  );
});

/**
 * Export CSV reports for orders, customers, or sales
 * GET /api/v1/admin/reports/export-csv
 */
const exportReportCSV = asyncHandler(async (req, res) => {
  const { type = 'orders', startDate, endDate } = req.query;

  let csvContent = '';

  if (type === 'orders') {
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'City', 'State', 'Status', 'Payment Method', 'Grand Total'];
    const rows = orders.map((o) => [
      o.orderId,
      o.createdAt.toISOString().split('T')[0],
      `"${o.shippingAddress?.fullName || ''}"`,
      o.shippingAddress?.phone || '',
      `"${o.shippingAddress?.city || ''}"`,
      `"${o.shippingAddress?.state || ''}"`,
      o.orderStatus,
      o.paymentMethod,
      o.pricing?.grandTotal || 0,
    ]);
    csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else if (type === 'customers') {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Registered Date', 'Status'];
    const rows = customers.map((c) => [
      c._id,
      `"${c.name}"`,
      c.email,
      c.phone || '',
      c.createdAt.toISOString().split('T')[0],
      c.isActive ? 'Active' : 'Blocked',
    ]);
    csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else if (type === 'inventory') {
    const products = await Product.find().populate('category', 'name');
    const headers = ['SKU', 'Name', 'Category', 'Price', 'Current Stock', 'Stock Status'];
    const rows = products.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category?.name || 'Uncategorized'}"`,
      p.price,
      p.stock,
      p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock',
    ]);
    csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
  return res.status(200).send(csvContent);
});

/**
 * [Admin] Search Analytics Overview
 * GET /api/v1/admin/reports/searches
 */
const getSearchAnalytics = asyncHandler(async (req, res) => {
  const topSearches = await SearchAnalytics.find().sort({ count: -1 }).limit(50);
  const totalAgg = await SearchAnalytics.aggregate([
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);

  return successResponse(
    res,
    {
      topSearches,
      totalQueries: totalAgg[0]?.total || 0,
      uniqueKeywords: topSearches.length,
    },
    'Search analytics retrieved'
  );
});

module.exports = {
  getSalesReport,
  exportReportCSV,
  getSearchAnalytics,
};

