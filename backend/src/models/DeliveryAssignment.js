/**
 * Delivery Assignment Mongoose Model
 * Manages seller-initiated dispatch requests, assignment timeouts, accept/decline atomic transitions
 */
const mongoose = require('mongoose');

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
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
    sellerStoreName: {
      type: String,
      default: 'Vendor Store',
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: false,
      default: null,
      index: true,
    },
    deliveryPartnerName: {
      type: String,
      default: '',
    },

    // Status Lifecycle
    status: {
      type: String,
      enum: ['requested', 'accepted', 'declined', 'expired', 'cancelled', 'reassigned'],
      default: 'requested',
      index: true,
    },

    // Deadlines & Timestamps
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    responseDeadline: {
      type: Date,
      required: true,
    },
    acceptedAt: Date,
    declinedAt: Date,
    declineReason: String,
    cancelledAt: Date,
    reassignedAt: Date,

    // Pickup & Drop Locations
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

    // Delivery Specs
    packageCount: {
      type: Number,
      default: 1,
    },
    totalWeightKg: {
      type: Number,
      default: 0.8,
    },
    distanceKm: {
      type: Number,
      default: 4.5,
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
    },
    deliveryFee: {
      type: Number,
      default: 65,
    },

    // Customer & Payment Info
    customerName: {
      type: String,
      required: true,
    },
    maskedCustomerPhone: {
      type: String,
      default: '+91 98XXX XXXXX',
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE', 'UPI', 'PREPAID'],
      default: 'ONLINE',
    },
    amountToCollect: {
      type: Number,
      default: 0,
    },
    specialInstructions: {
      type: String,
      default: 'Fragile handloom craft, handle with care.',
    },
  },
  { timestamps: true }
);

deliveryAssignmentSchema.index({ seller: 1, status: 1 });
deliveryAssignmentSchema.index({ deliveryPartner: 1, status: 1 });

module.exports = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);

