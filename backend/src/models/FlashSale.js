/**
 * Flash Sale Campaign Mongoose Model
 * Manages limited-time promotional deals with start/end schedules, product quotas, and live countdowns
 */
const mongoose = require('mongoose');

const flashSaleProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: [1, 'Discount value must be at least 1'],
    },
    salePrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    saleStock: {
      type: Number,
      required: true,
      min: [1, 'Sale stock must be at least 1'],
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const flashSaleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Flash sale title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: 'Limited time block-buster deal campaign',
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    products: [flashSaleProductSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

flashSaleSchema.index({ isActive: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('FlashSale', flashSaleSchema);

