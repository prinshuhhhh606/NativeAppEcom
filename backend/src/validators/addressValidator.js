const { body } = require('express-validator');

const createAddressValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('addressLine1').trim().notEmpty().withMessage('House / Flat / Road address is required').isLength({ min: 3 }),
  body('addressLine2').optional().trim(),
  body('landmark').optional().trim(),
  body('city').trim().notEmpty().withMessage('City / District is required'),
  body('state').trim().notEmpty().withMessage('State / Union Territory is required'),
  body('pinCode')
    .trim()
    .notEmpty()
    .withMessage('6-digit Indian PIN code is required')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit Indian PIN code (cannot start with 0)'),
  body('addressType').optional().isIn(['home', 'work', 'other']).withMessage('Address type must be home, work, or other'),
  body('isDefault').optional().isBoolean(),
];

const updateAddressValidator = [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('phone')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('addressLine1').optional().trim().isLength({ min: 3 }),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body('pinCode')
    .optional()
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit Indian PIN code'),
  body('addressType').optional().isIn(['home', 'work', 'other']),
  body('isDefault').optional().isBoolean(),
];

module.exports = {
  createAddressValidator,
  updateAddressValidator,
};

