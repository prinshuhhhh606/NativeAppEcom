/**
 * Order-Specific Customer Communication Mongoose Model
 * Legitimate order-related messaging between Seller and Customer
 */
const mongoose = require('mongoose');

const orderMessageSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      default: 'Customer',
    },
    senderRole: {
      type: String,
      enum: ['seller', 'customer', 'system'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    quickReplyKey: {
      type: String,
      default: '',
    },
    attachments: [
      {
        type: String, // Photo / slip URL
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderMessageSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('OrderMessage', orderMessageSchema);

