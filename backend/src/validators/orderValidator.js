const { body } = require('express-validator');

const createOrderValidator = [
  body('shippingAddressId')
    .optional(),
  body('deliveryAddressId')
    .optional(),
  body('shippingAddress')
    .optional(),
  body('deliveryAddress')
    .optional(),
  body().custom((value, { req }) => {
    const hasAddress =
      req.body.shippingAddressId ||
      req.body.deliveryAddressId ||
      (req.body.shippingAddress && (req.body.shippingAddress.addressLine1 || req.body.shippingAddress.streetAddress || req.body.shippingAddress.pinCode || req.body.shippingAddress.pincode)) ||
      (req.body.deliveryAddress && (req.body.deliveryAddress.addressLine1 || req.body.deliveryAddress.streetAddress || req.body.deliveryAddress.pinCode || req.body.deliveryAddress.pincode));

    if (!hasAddress) {
      throw new Error('Please provide either a valid address ID or delivery address object with PIN code');
    }
    return true;
  }),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .custom((val) => {
      if (!val) return false;
      const normalized = val.toString().trim().toUpperCase();
      const validTokens = ['COD', 'CASH', 'DELIVERY', 'RAZORPAY', 'CARD', 'UPI', 'ONLINE', 'NETBANKING', 'WALLET'];
      if (validTokens.some((tok) => normalized.includes(tok))) {
        return true;
      }
      return true; // Allow any custom payment method label from frontends
    }),
  body('couponCode')
    .optional()
    .trim()
    .toUpperCase(),
];

const updateOrderStatusValidator = [
  body('orderStatus')
    .optional(),
  body('status')
    .optional(),
  body().custom((value, { req }) => {
    const s = req.body.orderStatus || req.body.status;
    if (!s) {
      throw new Error('Order status is required');
    }
    return true;
  }),
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
};


