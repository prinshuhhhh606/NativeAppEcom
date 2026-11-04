const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ['customer', 'seller', 'delivery', 'franchise', 'admin', 'support_staff'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['customer', 'seller', 'delivery', 'franchise'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
    },
    userModel: {
      type: String,
      enum: ['User', 'Seller', 'DeliveryPartner'],
      default: 'User',
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
      default: '',
    },
    userPhone: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'order_issue',
        'refund_issue',
        'delivery_delayed',
        'seller_dispute',
        'payment_issue',
        'payout_issue',
        'account_issue',
        'other',
      ],
      default: 'order_issue',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedOrderNumber: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_for_response', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    assignedToName: {
      type: String,
      default: '',
    },
    messages: [ticketMessageSchema],
    resolutionNotes: {
      type: String,
      default: '',
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

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

