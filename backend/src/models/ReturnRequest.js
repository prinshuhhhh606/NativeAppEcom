/**
 * Return and Refund Request Mongoose Model
 */
const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
      },
    ],
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    additionalDetails: {
      type: String,
      default: '',
    },
    returnStatus: {
      type: String,
      enum: ['requested', 'approved', 'pickup_scheduled', 'picked_up', 'inspected', 'refunded', 'rejected'],
      default: 'requested',
      index: true,
    },
    refundAmount: {
      type: Number,
      required: true,
    },
    refundTransactionId: {
      type: String,
      default: '',
    },
    pickupAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

