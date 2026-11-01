/**
 * Seller Real-Time Notifications Controller
 */
const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Get Notifications for Seller
 * GET /api/v1/seller/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipientId: req.seller._id,
    recipientType: 'seller',
  })
    .sort({ createdAt: -1 })
    .limit(40);

  const unreadCount = await Notification.countDocuments({
    recipientId: req.seller._id,
    recipientType: 'seller',
    isRead: false,
  });

  return successResponse(res, { notifications, unreadCount }, 'Notifications retrieved');
});

/**
 * Mark Notifications as Read
 * PATCH /api/v1/seller/notifications/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.body || {};

  if (notificationId) {
    await Notification.updateOne(
      { _id: notificationId, recipientId: req.seller._id },
      { $set: { isRead: true } }
    );
  } else {
    await Notification.updateMany(
      { recipientId: req.seller._id, recipientType: 'seller', isRead: false },
      { $set: { isRead: true } }
    );
  }

  return successResponse(res, null, 'Notifications marked as read');
});

module.exports = {
  getNotifications,
  markAsRead,
};

