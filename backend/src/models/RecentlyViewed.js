/**
 * Recently Viewed Products Mongoose Model
 * Maintains customer product viewing history with timestamps and duplicate deduplication
 */
const mongoose = require('mongoose');

const recentlyViewedItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [recentlyViewedItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema);

