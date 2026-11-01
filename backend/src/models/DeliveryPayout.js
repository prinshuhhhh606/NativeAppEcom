/**
 * Delivery Payout Mongoose Model
 * Manages bank and UPI payout requests, admin approvals, and settlement receipts
 */
const mongoose = require('mongoose');

const deliveryPayoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [100, 'Minimum payout is ₹100'],
    },
    payoutMethod: {
      type: String,
      enum: ['BANK_TRANSFER', 'UPI', 'IMPS'],
      default: 'BANK_TRANSFER',
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
    adminRemarks: String,
  },
  { timestamps: true }
);

deliveryPayoutSchema.index({ deliveryPartner: 1, requestedAt: -1 });

module.exports = mongoose.model('DeliveryPayout', deliveryPayoutSchema);

