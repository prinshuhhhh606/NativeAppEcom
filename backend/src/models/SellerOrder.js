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
    customerEmail: {
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
        'pending',
        'new',
        'placed',
        'confirmed',
        'accepted',
        'processing',
        'preparing',
        'processing_completed',
        'packing',
        'packed',
        'ready_to_ship',
        'ready_for_pickup',
        'pickup_scheduled',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'rejected',
        'return_requested',
        'return_approved',
        'return_rejected',
        'return_pickup',
        'returned',
        'exchange_requested',
        'refund_processing',
        'refunded',
        'ndr',
        'rto',
      ],
      default: 'pending',
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

    // Lifecycle Timestamps
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: { type: String, default: '' },
    preparingAt: Date,
    readyForPickupAt: Date,
    pickedUpAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,

    // Delivery Partner Assignment Details
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      index: true,
    },
    deliveryPartnerName: { type: String, default: '' },
    deliveryPartnerPhone: { type: String, default: '' },
    deliveryPartnerVehicleType: { type: String, default: 'Bike' },
    deliveryPartnerVehicleNumber: { type: String, default: '' },
    deliveryPartnerRating: { type: Number, default: 4.8 },
    deliveryAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAssignment',
    },
    assignedAt: Date,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },

    // Courier & Shipping Details (Shiprocket / Pan-India Multi-Courier Ready)
    shipping: {
      courierName: { type: String, default: 'Delhivery' },
      trackingNumber: { type: String, default: '' },
      awbNumber: { type: String, default: '' },
      deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
      },
      deliveryPartnerName: { type: String, default: '' },
      deliveryPartnerPhone: { type: String, default: '' },
      vehicleType: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      labelUrl: { type: String, default: '' },
      invoiceUrl: { type: String, default: '' },
      weight: { type: Number, default: 0.5 }, // in kg
      dimensions: {
        length: { type: Number, default: 15 },
        width: { type: Number, default: 10 },
        height: { type: Number, default: 5 },
      },
      pickupScheduledDate: Date,
      pickupSlot: { type: String, default: '' },
      shippedAt: Date,
      deliveredAt: Date,
      estimatedDeliveryDate: Date,
      trackingHistory: [
        {
          status: { type: String, required: true },
          location: { type: String, default: 'Jaipur Logistics Hub' },
          timestamp: { type: Date, default: Date.now },
          remarks: { type: String, default: '' },
        },
      ],
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
      enum: ['none', 'requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refund_processing', 'refunded', 'refund_completed', 'exchange_requested'],
      default: 'none',
    },
    returnDetails: {
      reason: String,
      requestDate: Date,
      approvedDate: Date,
      rejectedReason: String,
      pickupDate: Date,
      refundAmount: Number,
      refundStatus: String,
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refund_processing', 'refunded', 'refund_completed', 'exchange_requested'],
        default: 'none',
      },
    },
  },
  {
    timestamps: true,
  }
);

sellerOrderSchema.index({ seller: 1, status: 1 });
sellerOrderSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('SellerOrder', sellerOrderSchema);

