const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Seller = require('../../models/Seller');
const DeliveryPartner = require('../../models/DeliveryPartner');
const Franchise = require('../../models/Franchise');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * 1. List Notifications Sent with Pagination
 * GET /api/v1/admin/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, recipientType } = req.query;

  const query = {};
  if (type && type !== 'all') query.type = type;
  if (recipientType && recipientType !== 'all') query.recipientType = recipientType;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Notification.countDocuments(query),
  ]);

  return successResponse(res, notifications, 'Notifications retrieved successfully', 200, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

/**
 * 2. Send Broadcast or Targeted Notification
 * POST /api/v1/admin/notifications/send
 */
const sendNotification = asyncHandler(async (req, res) => {
  const {
    targetAudience,
    recipientType,
    recipientId,
    title,
    message,
    type = 'promotional',
    imageUrl,
  } = req.body;

  const audience = targetAudience || recipientType || 'all';

  if (!title || !message) {
    return errorResponse(res, 'Notification title and message are required', 400);
  }

  let recipientCount = 0;
  const createdNotifications = [];

  if (audience === 'all' || audience === 'all_users') {
    const [customers, sellers, riders] = await Promise.all([
      User.find({ role: 'customer', isActive: true }).select('_id').lean(),
      Seller.find({ status: 'approved' }).select('_id').lean(),
      DeliveryPartner.find({ kycStatus: 'approved' }).select('_id').lean(),
    ]);

    const docs = [
      ...customers.map((c) => ({
        user: c._id,
        recipientId: c._id.toString(),
        recipientType: 'user',
        title: title.trim(),
        message: message.trim(),
        body: message.trim(),
        type,
        data: imageUrl ? { imageUrl } : {},
      })),
      ...sellers.map((s) => ({
        recipientId: s._id.toString(),
        recipientType: 'seller',
        title: title.trim(),
        message: message.trim(),
        body: message.trim(),
        type,
        data: imageUrl ? { imageUrl } : {},
      })),
      ...riders.map((r) => ({
        recipientId: r._id.toString(),
        recipientType: 'delivery',
        title: title.trim(),
        message: message.trim(),
        body: message.trim(),
        type,
        data: imageUrl ? { imageUrl } : {},
      })),
    ];
    recipientCount = docs.length;
    if (docs.length > 0) {
      await Notification.insertMany(docs.slice(0, 1000));
    }
  } else if (audience === 'customers' || audience === 'all_customers') {
    const customers = await User.find({ role: 'customer', isActive: true }).select('_id');
    recipientCount = customers.length;
    // Create notifications in batch
    const docs = customers.map((c) => ({
      user: c._id,
      recipientId: c._id.toString(),
      recipientType: 'user',
      title: title.trim(),
      message: message.trim(),
      body: message.trim(),
      type,
      data: imageUrl ? { imageUrl } : {},
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs.slice(0, 500)); // batch up to 500
    }
  } else if (targetAudience === 'all_sellers') {
    const sellers = await Seller.find({ status: 'approved' }).select('_id');
    recipientCount = sellers.length;
    const docs = sellers.map((s) => ({
      recipientId: s._id.toString(),
      recipientType: 'seller',
      title: title.trim(),
      message: message.trim(),
      body: message.trim(),
      type,
      data: imageUrl ? { imageUrl } : {},
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } else if (targetAudience === 'all_delivery') {
    const riders = await DeliveryPartner.find({ kycStatus: 'approved' }).select('_id');
    recipientCount = riders.length;
    const docs = riders.map((r) => ({
      recipientId: r._id.toString(),
      recipientType: 'delivery',
      title: title.trim(),
      message: message.trim(),
      body: message.trim(),
      type,
      data: imageUrl ? { imageUrl } : {},
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } else if (targetAudience === 'all_franchises') {
    const franchises = await Franchise.find({ status: 'active' }).select('_id');
    recipientCount = franchises.length;
    const docs = franchises.map((f) => ({
      recipientId: f._id.toString(),
      recipientType: 'franchise',
      title: title.trim(),
      message: message.trim(),
      body: message.trim(),
      type,
      data: imageUrl ? { imageUrl } : {},
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } else {
    // Specific Recipient
    recipientCount = 1;
    await Notification.create({
      user: targetAudience === 'specific_customer' ? recipientId : undefined,
      recipientId,
      recipientType: targetAudience.includes('seller') ? 'seller' : 'user',
      title: title.trim(),
      message: message.trim(),
      body: message.trim(),
      type,
      data: imageUrl ? { imageUrl } : {},
    });
  }

  // Audit log
  if (req.admin) {
    try {
      await AuditLog.create({
        admin: req.admin._id,
        adminName: req.admin.name || 'Admin',
        adminEmail: req.admin.email || '',
        action: 'NOTIFICATION_BROADCAST',
        module: 'notifications',
        details: { targetAudience, title, recipientCount },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (e) {}
  }

  return successResponse(
    res,
    { targetAudience, recipientCount, title },
    `Notification dispatched successfully to ${recipientCount} recipients`
  );
});

module.exports = {
  getNotifications,
  sendNotification,
};
