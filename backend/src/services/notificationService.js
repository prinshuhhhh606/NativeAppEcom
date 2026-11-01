const Notification = require('../models/Notification');

/**
 * Create a new notification for a user.
 */
const createNotification = async (userId, { title, message, type = 'system', data = {} }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      data,
    });
    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error.message);
    return null;
  }
};

/**
 * Trigger order-related notifications.
 */
const sendOrderNotification = async (userId, order, action = 'created') => {
  let title = 'Order Update';
  let message = `Your order #${order.orderId} status has changed to ${order.orderStatus}.`;

  if (action === 'created') {
    title = 'Order Placed Successfully!';
    message = `Your order #${order.orderId} for ₹${order.pricing?.grandTotal || 0} has been placed.`;
  } else if (action === 'shipped') {
    title = 'Order Shipped!';
    message = `Your order #${order.orderId} is on the way via ${order.shippingDetails?.courierName || 'courier'}.`;
  } else if (action === 'delivered') {
    title = 'Order Delivered!';
    message = `Your order #${order.orderId} has been successfully delivered. Thank you for shopping with us!`;
  } else if (action === 'cancelled') {
    title = 'Order Cancelled';
    message = `Your order #${order.orderId} has been cancelled.`;
  }

  return createNotification(userId, {
    title,
    message,
    type: 'order',
    data: { orderId: order.orderId, mongoOrderId: order._id },
  });
};

module.exports = {
  createNotification,
  sendOrderNotification,
};

