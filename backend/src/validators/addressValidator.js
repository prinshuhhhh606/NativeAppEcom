const { body } = require('express-validator');

const createAddressValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
  body().custom((value, { req }) => {
    const phone = req.body.mobileNumber || req.body.phone;
    if (!phone) {
      throw new Error('Contact phone or mobile number is required');
    }
    if (!/^[6-9]\d{9}$/.test(phone.toString().trim())) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }
    return true;
  }),
  body().custom((value, { req }) => {
    const street = req.body.addressLine1 || req.body.streetAddress;
    if (!street || street.toString().trim().length < 3) {
      throw new Error('House / Flat / Road address is required');
    }
    return true;
  }),
  body('addressLine2').optional().trim(),
  body('landmark').optional().trim(),
  body('city').trim().notEmpty().withMessage('City / District is required'),
  body('state').trim().notEmpty().withMessage('State / Union Territory is required'),
  body().custom((value, { req }) => {
    const pin = req.body.pinCode || req.body.pincode;
    if (!pin) {
      throw new Error('6-digit Indian PIN code is required');
    }
    if (!/^[1-9][0-9]{5}$/.test(pin.toString().trim())) {
      throw new Error('Please enter a valid 6-digit Indian PIN code (cannot start with 0)');
    }
    return true;
  }),
  body('addressType')
    .optional()
    .custom((val) => {
      if (!val) return true;
      const lower = val.toString().toLowerCase();
      if (!['home', 'work', 'other'].includes(lower)) {
        throw new Error('Address type must be Home, Work, or Other');
      }
      return true;
    }),
  body('isDefault').optional().isBoolean(),
];

const updateAddressValidator = [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body().custom((value, { req }) => {
    const phone = req.body.mobileNumber || req.body.phone;
    if (phone && !/^[6-9]\d{9}$/.test(phone.toString().trim())) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }
    return true;
  }),
  body().custom((value, { req }) => {
    const street = req.body.addressLine1 || req.body.streetAddress;
    if (street !== undefined && street.toString().trim().length < 3) {
      throw new Error('House / Flat / Road address is required');
    }
    return true;
  }),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body().custom((value, { req }) => {
    const pin = req.body.pinCode || req.body.pincode;
    if (pin && !/^[1-9][0-9]{5}$/.test(pin.toString().trim())) {
      throw new Error('Please enter a valid 6-digit Indian PIN code');
    }
    return true;
  }),
  body('addressType')
    .optional()
    .custom((val) => {
      if (!val) return true;
      const lower = val.toString().toLowerCase();
      if (!['home', 'work', 'other'].includes(lower)) {
        throw new Error('Address type must be Home, Work, or Other');
      }
      return true;
    }),
  body('isDefault').optional().isBoolean(),
];

module.exports = {
  createAddressValidator,
  updateAddressValidator,
};

