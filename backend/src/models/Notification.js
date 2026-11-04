/**
 * Notification Mongoose Model
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['user', 'seller', 'delivery', 'admin'],
      default: 'user',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: 'notifications-outline',
    },
    type: {
      type: String,
      enum: ['order', 'payment', 'shipping', 'delivery', 'cancellation', 'refund', 'offer'],
      default: 'order',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

