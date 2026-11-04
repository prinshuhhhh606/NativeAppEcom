/**
 * Cart Mongoose Model
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      default: 0,
    },
    priceAtAddition: {
      type: Number,
      default: 0,
    },
    variant: {
      color: { type: String, default: '' },
      size: { type: String, default: '' },
    },
    selectedVariant: {
      color: { type: String, default: '' },
      size: { type: String, default: '' },
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    products: [cartItemSchema],
    appliedCoupon: {
      code: { type: String },
      discountAmount: { type: Number, default: 0 },
      discountType: { type: String },
      discountValue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cart', cartSchema);

