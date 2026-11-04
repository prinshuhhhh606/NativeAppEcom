const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'PRODUCT_CREATED', 'ORDER_STATUS_UPDATED', 'STOCK_ADJUSTED'
    },
    module: {
      type: String,
      required: true,
      enum: [
        'products',
        'categories',
        'inventory',
        'orders',
        'customers',
        'coupons',
        'payments',
        'shipping',
        'returns',
        'settings',
        'auth',
        'sellers',
        'delivery',
        'franchises',
        'support',
        'notifications',
        'commissions',
        'payouts',
      ],
    },
    targetId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

