const { body } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ min: 3 }),
  body('description').trim().notEmpty().withMessage('Product description is required').isLength({ min: 10 }),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a valid number')
    .custom((value, { req }) => {
      if (value && Number(value) >= Number(req.body.price)) {
        throw new Error('Discount price must be less than original price');
      }
      return true;
    }),
  body('category').notEmpty().withMessage('Category ID is required').isMongoId().withMessage('Invalid Category ID'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
  body('brand').optional().trim(),
];

const updateProductValidator = [
  body('name').optional().trim().isLength({ min: 3 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('price').optional().isFloat({ min: 0.01 }),
  body('discountPrice').optional().isFloat({ min: 0 }),
  body('category').optional().isMongoId(),
  body('stock').optional().isInt({ min: 0 }),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
};

