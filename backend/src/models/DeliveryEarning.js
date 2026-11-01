/**
 * Delivery Earning Ledger Mongoose Model
 * Tracks financial ledger for completed deliveries, incentives, tips, and deductions
 */
const mongoose = require('mongoose');

const deliveryEarningSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    orderNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['delivery_fee', 'distance_surge', 'peak_incentive', 'cod_commission', 'adjustment', 'payout'],
      default: 'delivery_fee',
    },
    baseFee: {
      type: Number,
      required: true,
      default: 50,
    },
    distanceSurge: {
      type: Number,
      default: 0,
    },
    incentive: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'available', 'paid', 'reversed'],
      default: 'available',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      default: 'Delivery completion earnings credit',
    },
  },
  { timestamps: true }
);

deliveryEarningSchema.index({ deliveryPartner: 1, date: -1 });

module.exports = mongoose.model('DeliveryEarning', deliveryEarningSchema);

