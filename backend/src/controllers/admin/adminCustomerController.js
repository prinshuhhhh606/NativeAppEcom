const User = require('../../models/User');
const Order = require('../../models/Order');
const Address = require('../../models/Address');
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
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'blocked') {
    filter.isActive = false;
  }

  const [customers, total] = await Promise.all([
    User.find(filter)
      .select('-password -otp -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  // Compute total orders and spending for each customer
  const enrichedCustomers = await Promise.all(
    customers.map(async (c) => {
      const stats = await Order.aggregate([
        { $match: { user: c._id, orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$pricing.grandTotal' },
          },
        },
      ]);

      return {
        ...c.toObject(),
        totalOrders: stats[0]?.totalOrders || 0,
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
 * Get detailed customer profile with order history and saved addresses
 * GET /api/v1/admin/customers/:id
 */
const getCustomerDetails = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select(
    '-password -otp -refreshToken'
  );

  if (!customer) {
    return errorResponse(res, 'Customer not found', 404);
  }

  const [orders, addresses] = await Promise.all([
    Order.find({ user: customer._id }).sort({ createdAt: -1 }),
    Address.find({ user: customer._id }),
  ]);

  const totalSpent = orders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);

  return successResponse(
    res,
    {
      customer,
      addresses,
      orders,
      stats: {
        totalOrders: orders.length,
        totalSpent,
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

  recordAuditLog(req, customer.isActive ? 'CUSTOMER_UNBLOCKED' : 'CUSTOMER_BLOCKED', 'customers', customer._id, {
    customerName: customer.name,
    customerEmail: customer.email,
  });

  return successResponse(
    res,
    { id: customer._id, isActive: customer.isActive },
    `Customer account has been ${customer.isActive ? 'unblocked' : 'blocked'}`
  );
});

module.exports = {
  getCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
};

