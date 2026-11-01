/**
 * Payout Mongoose Model
 * Manages seller payout requests, bank settlements, and admin approvals
 */
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [500, 'Minimum payout request is ₹500'],
    },
    bankDetailsSnapshot: {
      accountHolderName: String,
      accountNumberMasked: String,
      ifscCode: String,
      bankName: String,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'failed'],
      default: 'pending',
      index: true,
    },
    transactionReference: {
      type: String, // Bank UTR / Razorpay Payout ID
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);

