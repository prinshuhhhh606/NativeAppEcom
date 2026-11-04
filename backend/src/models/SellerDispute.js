/**
 * Seller Dispute & Protection Mongoose Model
 * Manages suspicious order reports, return abuse, delivery disputes, and evidence submissions
 */
const mongoose = require('mongoose');

const sellerDisputeSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number or reference is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['suspicious_order', 'return_abuse', 'delivery_dispute', 'damage_claim', 'policy_violation'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed explanation is required'],
      trim: true,
    },
    evidenceFiles: [
      {
        type: String, // URLs of photos, CCTV footage, unboxing videos, packing photos
      },
    ],
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected', 'escalated'],
      default: 'open',
      index: true,
    },
    claimAmount: {
      type: Number,
      default: 0,
    },
    compensatedAmount: {
      type: Number,
      default: 0,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SellerDispute', sellerDisputeSchema);

