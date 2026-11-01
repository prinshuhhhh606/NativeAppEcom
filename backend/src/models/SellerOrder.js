/**
 * SellerOrder Mongoose Model
 * Manages seller-specific sub-orders for multi-vendor order fulfillment
 */
const mongoose = require('mongoose');

const sellerOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedVariant: {
      color: String,
      size: String,
      variantId: String,
      sku: String,
    },
    image: { type: String, default: '' },
    gstPercentage: { type: Number, default: 18 },
  },
  { _id: false }
);

const sellerOrderSchema = new mongoose.Schema(
  {
    subOrderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
    shippingAddress: {
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pinCode: String,
      mobileNumber: String,
    },
    items: [sellerOrderItemSchema],
    itemCount: {
      type: Number,
      default: 1,
    },

    // Financial breakdown
    subtotal: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      default: 10, // Platform commission percentage
    },
    commissionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    netEarnings: {
      type: Number,
      required: true, // subtotal - commissionAmount
    },

    // Fulfillment Lifecycle
    status: {
      type: String,
      enum: [
        'new',
        'accepted',
        'processing',
        'packed',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
      ],
      default: 'new',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE', 'UPI', 'CARD', 'NETBANKING', 'WALLET'],
      default: 'ONLINE',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },

    // Courier & Shipping Details (Shiprocket Ready)
    shipping: {
      courierName: { type: String, default: 'Delhivery' },
      trackingNumber: { type: String, default: '' },
      labelUrl: { type: String, default: '' },
      invoiceUrl: { type: String, default: '' },
      pickupScheduledDate: Date,
      shippedAt: Date,
      deliveredAt: Date,
      estimatedDeliveryDate: Date,
    },

    // Cancellation & Returns
    cancelledReason: String,
    cancelledAt: Date,
    cancellationSource: {
      type: String,
      enum: ['seller', 'customer', 'admin', 'system'],
    },
    returnReason: String,
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'received', 'refunded'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

sellerOrderSchema.index({ seller: 1, status: 1 });
sellerOrderSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('SellerOrder', sellerOrderSchema);

