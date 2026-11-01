/**
 * Search Analytics Mongoose Model
 * Tracks customer search keywords, frequency, and result counts
 */
const mongoose = require('mongoose');

const searchAnalyticsSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastResultCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SearchAnalytics', searchAnalyticsSchema);

