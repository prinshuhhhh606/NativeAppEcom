const User = require('../../models/User');
const Order = require('../../models/Order');
const Address = require('../../models/Address');
const Payment = require('../../models/Payment');
const Refund = require('../../models/Refund');
const SupportTicket = require('../../models/SupportTicket');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');

/**
 * List all customers with pagination, search, order counts and total spend
 * GET /api/v1/admin/customers
 */
const getCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { search, status } = req.query;
  const filter = { role: 'customer' };

  if (search) {
    const trimmed = search.trim();
    const regex = new RegExp(trimmed, 'i');
    const isObjectId = trimmed.match(/^[0-9a-fA-F]{24}$/);
    filter.$or = [
      { name: regex },
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { mobileNumber: regex },
      ...(isObjectId ? [{ _id: trimmed }] : []),
    ];
  }

  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'blocked' || status === 'inactive') {
    filter.isActive = false;
  }

  const [customers, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordHash -otp -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Compute total orders and spending for each customer
  const enrichedCustomers = await Promise.all(
    customers.map(async (c) => {
      const stats = await Order.aggregate([
        { $match: { user: c._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            cancelledOrders: {
              $sum: {
                $cond: [{ $in: ['$orderStatus', ['Cancelled', 'cancelled']] }, 1, 0],
              },
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $ne: ['$orderStatus', 'Cancelled'] },
                  { $ifNull: ['$totalAmount', { $ifNull: ['$pricing.grandTotal', 0] }] },
                  0,
                ],
              },
            },
          },
        },
      ]);

      return {
        ...c,
        fullName: c.fullName || c.name,
        phone: c.phone || c.mobileNumber,
        totalOrders: stats[0]?.totalOrders || 0,
        cancelledOrders: stats[0]?.cancelledOrders || 0,
        totalSpent: stats[0]?.totalSpent || 0,
      };
    })
  );

  return successResponse(res, enrichedCustomers, 'Customers retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get detailed customer profile with order history, addresses, payments, refunds, complaints
 * GET /api/v1/admin/customers/:id
 */
const getCustomerDetails = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' })
    .select('-password -passwordHash -otp -refreshToken')
    .lean();

  if (!customer) {
    return errorResponse(res, 'Customer not found', 404);
  }

  const [orders, addresses, payments, complaints] = await Promise.all([
    Order.find({ user: customer._id }).sort({ createdAt: -1 }).lean(),
    Address.find({ user: customer._id }).lean(),
    Payment.find({ user: customer._id }).sort({ createdAt: -1 }).lean(),
    SupportTicket.find({ user: customer._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const cancelledOrders = orders.filter((o) =>
    ['Cancelled', 'cancelled', 'Rejected', 'rejected'].includes(o.orderStatus)
  );

  const totalSpent = orders
    .filter((o) => !['Cancelled', 'cancelled', 'Rejected', 'rejected'].includes(o.orderStatus))
    .reduce(
      (sum, o) => sum + (o.totalAmount || o.pricing?.grandTotal || 0),
      0
    );

  const orderIds = orders.map((o) => o._id);
  const refunds = await Refund.find({ order: { $in: orderIds } }).lean();

  return successResponse(
    res,
    {
      customer: {
        ...customer,
        fullName: customer.fullName || customer.name,
        phone: customer.phone || customer.mobileNumber,
      },
      addresses,
      orders: orders.map((o) => ({
        ...o,
        orderId: o.orderId || o.orderNumber,
        amount: o.totalAmount || o.pricing?.grandTotal || 0,
      })),
      cancelledOrders,
      payments,
      refunds,
      complaints,
      stats: {
        totalOrders: orders.length,
        cancelledCount: cancelledOrders.length,
        totalSpent,
        lastOrder: orders[0]?.createdAt || null,
      },
    },
    'Customer details fetched'
  );
});

/**
 * Block or Unblock Customer
 * PATCH /api/v1/admin/customers/:id/toggle-status
 */
const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);

  if (!customer) {
    return errorResponse(res, 'Customer not found', 404);
  }

  customer.isActive = !customer.isActive;
  await customer.save();

  recordAuditLog(
    req,
    customer.isActive ? 'CUSTOMER_UNBLOCKED' : 'CUSTOMER_BLOCKED',
    'customers',
    customer._id,
    {
      customerName: customer.fullName || customer.name,
      customerEmail: customer.email,
    }
  );

  return successResponse(
    res,
    { id: customer._id, isActive: customer.isActive },
    `Customer account has been ${customer.isActive ? 'unblocked' : 'blocked'}`
  );
});

/**
 * Update Permitted Customer Details
 * PUT /api/v1/admin/customers/:id
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const { fullName, name, email, phone, mobileNumber } = req.body;
  const customer = await User.findById(req.params.id);

  if (!customer) {
    return errorResponse(res, 'Customer not found', 404);
  }

  if (fullName || name) customer.fullName = (fullName || name).trim();
  if (email) customer.email = email.toLowerCase().trim();
  if (phone || mobileNumber) {
    customer.phone = (phone || mobileNumber).trim();
    customer.mobileNumber = (phone || mobileNumber).trim();
  }

  await customer.save();

  return successResponse(res, customer, 'Customer profile updated successfully');
});

/**
 * Export Customers as CSV
 * GET /api/v1/admin/customers/export/csv
 */
const exportCustomersCSV = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('fullName name email phone mobileNumber isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Status', 'Registered Date'];
  const rows = customers.map((c) => [
    `"${c._id}"`,
    `"${c.fullName || c.name || ''}"`,
    `"${c.email || ''}"`,
    `"${c.phone || c.mobileNumber || ''}"`,
    `"${c.isActive ? 'Active' : 'Blocked'}"`,
    `"${new Date(c.createdAt).toLocaleDateString('en-IN')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bharat_bazaar_customers.csv"');
  return res.send(csvContent);
});

module.exports = {
  getCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
  updateCustomer,
  exportCustomersCSV,
};
