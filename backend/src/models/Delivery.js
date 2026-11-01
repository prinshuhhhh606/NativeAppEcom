/**
 * Active & Completed Delivery Mongoose Model
 * Manages full lifecycle from pickup to doorstep delivery, dual OTPs, and proof of delivery
 */
const mongoose = require('mongoose');

const deliveryTimelineItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    title: String,
    notes: String,
    locationText: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    deliveryNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAssignment',
      required: true,
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
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },

    // Detailed Status Workflow
    status: {
      type: String,
      enum: [
        'assigned',
        'accepted',
        'reached_pickup',
        'picked_up',
        'out_for_delivery',
        'reached_customer',
        'delivered',
        'delivery_failed',
        'return_to_seller',
        'cancelled',
      ],
      default: 'assigned',
      index: true,
    },

    // Addresses
    pickupAddress: {
      storeName: String,
      addressLine: String,
      city: String,
      state: String,
      pinCode: String,
      contactPhone: String,
      latitude: Number,
      longitude: Number,
    },
    deliveryAddress: {
      fullName: String,
      addressLine: String,
      city: String,
      state: String,
      pinCode: String,
      mobileNumber: String,
      latitude: Number,
      longitude: Number,
    },

    // Dual-OTP Verification Protocol
    pickupOtp: {
      type: String,
      default: '7821',
    },
    pickupOtpVerified: {
      type: Boolean,
      default: false,
    },
    pickupVerifiedAt: Date,

    deliveryOtp: {
      type: String,
      default: '4521',
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,

    // Financial & Cash Collection
    deliveryFee: {
      type: Number,
      default: 65,
    },
    paymentMethod: {
      type: String,
      default: 'ONLINE',
    },
    codAmount: {
      type: Number,
      default: 0,
    },
    codCollected: {
      type: Boolean,
      default: false,
    },
    codCollectedAt: Date,

    // Proof of Delivery
    proofOfDelivery: {
      photoUrl: String,
      signatureUrl: String,
      receiverName: String,
      receiverRelation: String,
    },

    // Failed Delivery Handling
    failureReason: {
      type: String,
      enum: [
        'customer_unavailable',
        'customer_refused',
        'incorrect_address',
        'phone_unreachable',
        'pincode_mismatch',
        'package_damaged',
        'other',
      ],
    },
    failureNotes: String,
    failedAt: Date,

    // Real-Time Location for Tracking
    currentLocation: {
      latitude: Number,
      longitude: Number,
      heading: Number,
      speed: Number,
      updatedAt: { type: Date, default: Date.now },
    },
    locationTrackingEnabled: {
      type: Boolean,
      default: true,
    },

    timeline: [deliveryTimelineItemSchema],
  },
  { timestamps: true }
);

deliverySchema.index({ deliveryPartner: 1, status: 1 });
deliverySchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);

