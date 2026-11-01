/**
 * SellerLedger Mongoose Model
 * Double-entry style financial transaction ledger for sellers
 */
const mongoose = require('mongoose');

const sellerLedgerSchema = new mongoose.Schema(
  {
    transactionId: {
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
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    category: {
      type: String,
      enum: ['order_sale', 'platform_commission', 'payout_withdrawal', 'refund_deduction', 'adjustment'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String, // Order Number, SubOrder Number, or Payout ID
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'failed', 'cancelled'],
      default: 'cleared',
    },
  },
  {
    timestamps: true,
  }
);

sellerLedgerSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('SellerLedger', sellerLedgerSchema);

