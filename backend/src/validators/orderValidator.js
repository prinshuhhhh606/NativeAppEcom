const { body } = require('express-validator');

const createOrderValidator = [
  body('shippingAddressId')
    .optional()
    .isMongoId()
    .withMessage('Invalid shipping address ID'),
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object'),
  body().custom((value, { req }) => {
    if (!req.body.shippingAddressId && !req.body.shippingAddress) {
      throw new Error('Please provide either shippingAddressId or full shippingAddress object');
    }
    return true;
  }),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['COD', 'Razorpay', 'Card', 'UPI', 'NetBanking', 'Wallet'])
    .withMessage('Invalid payment method selected'),
  body('couponCode')
    .optional()
    .trim()
    .toUpperCase(),
];

const updateOrderStatusValidator = [
  body('orderStatus')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn([
      'Pending',
      'Confirmed',
      'Processing',
      'Packed',
      'Shipped',
      'OutForDelivery',
      'Delivered',
      'Cancelled',
      'Returned',
    ])
    .withMessage('Invalid order status'),
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
};

