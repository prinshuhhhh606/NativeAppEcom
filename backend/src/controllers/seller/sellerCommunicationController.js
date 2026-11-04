/**
 * Seller-Customer Communication Controller
 * Safe, order-specific messaging with customer privacy protection and quick replies
 */
const OrderMessage = require('../../models/OrderMessage');
const Order = require('../../models/Order');
const SellerOrder = require('../../models/SellerOrder');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const QUICK_REPLIES = [
  { id: 'qr_packed', title: 'Package Packed', text: 'Namaste! Your order has been carefully quality-checked, packed with security seal, and is ready for courier dispatch.' },
  { id: 'qr_delay', title: 'Dispatch Delay Notice', text: 'Namaste! Due to severe local weather / transit conditions, your dispatch may experience a slight 24-hour delay. We appreciate your patience.' },
  { id: 'qr_handcrafted', title: 'Handcrafting Notice', text: 'Namaste! Your product is currently undergoing final artisan finishing to guarantee genuine handcrafted perfection.' },
  { id: 'qr_address_confirm', title: 'Delivery Address Confirmation', text: 'Namaste! Please confirm your exact landmark or house number so our delivery partner can reach your doorstep swiftly.' },
  { id: 'qr_dispatched', title: 'Dispatched with Carrier', text: 'Namaste! Your parcel has been handed over to our delivery partner. You can track real-time transit via the Bharat Bazaar app.' },
];

/**
 * Get Quick Reply Templates
 * GET /api/v1/seller/communication/quick-replies
 */
const getQuickReplies = asyncHandler(async (req, res) => {
  return successResponse(res, QUICK_REPLIES, 'Quick replies fetched');
});

/**
 * Get Messages for a specific Order
 * GET /api/v1/seller/communication/orders/:orderId
 */
const getOrderMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Verify seller has this order
  const orderDoc =
    (await SellerOrder.findOne({ _id: orderId, seller: req.seller._id })) ||
    (await Order.findOne({ _id: orderId }));

  const messages = await OrderMessage.find({
    $or: [{ order: orderId }, { orderNumber: orderDoc?.orderNumber || orderDoc?.subOrderNumber || orderId }],
    seller: req.seller._id,
  }).sort({ createdAt: 1 });

  return successResponse(res, messages, 'Order messages fetched');
});

/**
 * Send Message for Order
 * POST /api/v1/seller/communication/orders/:orderId
 */
const sendOrderMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { text, quickReplyKey, attachments = [] } = req.body || {};

  if (!text || !text.trim()) {
    return errorResponse(res, 'Message text is required', 400);
  }

  // Find order
  let orderNumber = orderId;
  let customerId = null;
  let customerName = 'Customer';

  const sellerOrder = await SellerOrder.findOne({ _id: orderId, seller: req.seller._id });
  if (sellerOrder) {
    orderNumber = sellerOrder.subOrderNumber || sellerOrder.parentOrderNumber || orderId;
    customerId = sellerOrder.customer;
    customerName = sellerOrder.customerName || 'Customer';
  } else {
    const parentOrder = await Order.findOne({ _id: orderId });
    if (parentOrder) {
      orderNumber = parentOrder.orderNumber;
      customerId = parentOrder.user;
      customerName = parentOrder.shippingAddress?.fullName || 'Customer';
    }
  }

  const message = await OrderMessage.create({
    order: orderId,
    orderNumber,
    seller: req.seller._id,
    customer: customerId,
    customerName,
    senderRole: 'seller',
    senderName: req.seller.storeName || req.seller.name || 'Store Merchant',
    text: text.trim(),
    quickReplyKey: quickReplyKey || '',
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  return successResponse(res, message, 'Message sent successfully', 201);
});

module.exports = {
  getQuickReplies,
  getOrderMessages,
  sendOrderMessage,
};

