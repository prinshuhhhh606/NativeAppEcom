const Notification = require('../models/Notification');

/**
 * Create a new notification for a user or seller.
 */
const createNotification = async (recipientId, { title, message, body, type = 'order', recipientType = 'user', data = {} }) => {
  try {
    const notificationContent = message || body || title;
    const notification = await Notification.create({
      user: recipientType === 'user' ? recipientId : undefined,
      recipientId: recipientId,
      recipientType: recipientType,
      title,
      body: notificationContent,
      message: notificationContent,
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
 * Trigger order-related notifications for customer orders.
 */
const sendOrderNotification = async (userId, order, action = 'created') => {
  let title = 'Order Update';
  let message = `Your order #${order.orderId || order.orderNumber} status has changed to ${order.orderStatus}.`;

  if (action === 'created') {
    title = 'Order Placed Successfully!';
    message = `Your order #${order.orderId || order.orderNumber} for ₹${order.pricing?.grandTotal || order.totalAmount || 0} has been placed.`;
  } else if (action === 'shipped') {
    title = 'Order Shipped!';
    message = `Your order #${order.orderId || order.orderNumber} is on the way via ${order.shippingDetails?.courierName || order.courierPartner || 'courier'}.`;
  } else if (action === 'delivered') {
    title = 'Order Delivered!';
    message = `Your order #${order.orderId || order.orderNumber} has been successfully delivered. Thank you for shopping with us!`;
  } else if (action === 'cancelled') {
    title = 'Order Cancelled';
    message = `Your order #${order.orderId || order.orderNumber} has been cancelled.`;
  }

  return createNotification(userId, {
    title,
    message,
    type: 'order',
    recipientType: 'user',
    data: { orderId: order.orderId || order.orderNumber, mongoOrderId: order._id },
  });
};

/**
 * Trigger notification to Seller when a new order arrives.
 */
const sendSellerNewOrderNotification = async (sellerId, subOrder) => {
  return createNotification(sellerId, {
    title: 'New Customer Order Received! 🎉',
    message: `You have received a new order #${subOrder.subOrderNumber || subOrder.orderNumber} for ₹${subOrder.subtotal}. Please accept and pack the order.`,
    type: 'order',
    recipientType: 'seller',
    data: {
      subOrderNumber: subOrder.subOrderNumber,
      orderNumber: subOrder.orderNumber,
      itemCount: subOrder.itemCount,
      subtotal: subOrder.subtotal,
    },
  });
};

/**
 * Trigger notification to Customer when Seller updates fulfillment status.
 */
const sendCustomerFulfillmentNotification = async (userId, subOrder, action, reason = '') => {
  let title = 'Order Update';
  let message = `Your order #${subOrder.orderNumber} status has been updated to ${action}.`;

  if (action === 'accepted' || action === 'confirmed') {
    title = 'Order Accepted by Seller! ✅';
    message = `Great news! The seller has confirmed your order #${subOrder.orderNumber} and is preparing the package.`;
  } else if (action === 'processing' || action === 'packed') {
    title = 'Order Being Packed 📦';
    message = `Your items for order #${subOrder.orderNumber} have been packed securely and are awaiting courier pickup.`;
  } else if (action === 'ready_to_ship' || action === 'pickup_scheduled') {
    title = 'Ready for Courier Dispatch 🚚';
    message = `Courier pickup has been scheduled for your order #${subOrder.orderNumber}.`;
  } else if (action === 'shipped' || action === 'in_transit') {
    title = 'Order Dispatched with Courier! 🚀';
    const courier = subOrder.shipping?.courierName || 'Delhivery';
    const trk = subOrder.shipping?.trackingNumber || subOrder.shipping?.awbNumber || '';
    message = `Your order #${subOrder.orderNumber} is on the way via ${courier}.${trk ? ` Tracking ID: ${trk}` : ''}`;
  } else if (action === 'out_for_delivery') {
    title = 'Out for Delivery Today! 🛵';
    message = `Your package for order #${subOrder.orderNumber} is out for delivery and will reach you shortly.`;
  } else if (action === 'delivered') {
    title = 'Order Delivered! 🎉';
    message = `Your order #${subOrder.orderNumber} has been successfully delivered. We hope you enjoy your purchase!`;
  } else if (action === 'rejected') {
    title = 'Order Rejected by Seller ❌';
    message = `The seller could not fulfill order #${subOrder.orderNumber}. Reason: ${reason || subOrder.cancelledReason || 'Stock unavailable'}. Refund is being processed.`;
  } else if (action === 'cancelled') {
    title = 'Order Cancelled';
    message = `Order #${subOrder.orderNumber} has been cancelled.`;
  }

  return createNotification(userId, {
    title,
    message,
    type: 'order',
    recipientType: 'user',
    data: {
      orderNumber: subOrder.orderNumber,
      subOrderNumber: subOrder.subOrderNumber,
      status: action,
    },
  });
};

module.exports = {
  createNotification,
  sendOrderNotification,
  sendSellerNewOrderNotification,
  sendCustomerFulfillmentNotification,
};
