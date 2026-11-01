/**
 * Payment Mongoose Model
 */
const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_STATUS_LIST } = require('../constants/paymentStatus');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentGateway: {
      type: String,
      default: 'Razorpay',
    },
    gatewayOrderId: {
      type: String,
      default: '',
      index: true,
    },
    transactionId: {
      type: String,
      default: '',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_LIST,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);

