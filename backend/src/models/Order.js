/**
 * Order Mongoose Model
 */
const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_STATUS_LIST } = require('../constants/orderStatus');
const { PAYMENT_METHODS, PAYMENT_STATUS, PAYMENT_METHOD_LIST, PAYMENT_STATUS_LIST } = require('../constants/paymentStatus');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedVariant: {
      color: String,
      size: String,
      variantId: String,
      sku: String,
    },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const timelineStepSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    time: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        index: true,
      },
    ],
    sellerOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerOrder',
      },
    ],
    items: [orderItemSchema],
    deliveryAddress: {
      fullName: { type: String, required: true },
      mobileNumber: { type: String, default: '' },
      phone: { type: String, default: '' },
      alternatePhone: String,
      addressLine1: { type: String, default: '' },
      addressLine2: String,
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
      addressType: { type: String, default: 'Home' },
      latitude: { type: Number, default: 26.9015 },
      longitude: { type: Number, default: 75.7421 },
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      alternatePhone: String,
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      pinCode: String,
      addressType: { type: String, default: 'home' },
      latitude: { type: Number, default: 26.9015 },
      longitude: { type: Number, default: 75.7421 },
    },
    pickupAddress: {
      storeName: { type: String, default: 'Store Hub' },
      addressLine: { type: String, default: 'Market Road' },
      city: { type: String, default: 'Jaipur' },
      state: { type: String, default: 'Rajasthan' },
      pinCode: { type: String, default: '302001' },
      contactPhone: { type: String, default: '' },
      latitude: { type: Number, default: 26.9124 },
      longitude: { type: Number, default: 75.7873 },
    },
    pricing: {
      subtotal: Number,
      discount: Number,
      deliveryFee: Number,
      tax: Number,
      grandTotal: Number,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    appliedCouponCode: {
      type: String,
      default: null,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: PAYMENT_METHODS.UPI,
    },
    paymentStatus: {
      type: String,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    orderStatus: {
      type: String,
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    courierPartner: {
      type: String,
      default: 'Delhivery Pan-India Express',
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
    },
    deliveryPartnerName: { type: String, default: '' },
    deliveryPartnerPhone: { type: String, default: '' },
    deliveryPartnerVehicle: { type: String, default: '' },
    deliveryPartnerPhoto: { type: String, default: '' },
    deliveryPartnerRating: { type: Number, default: 4.85 },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      heading: Number,
      speed: Number,
      updatedAt: { type: Date, default: Date.now },
    },
    distanceRemainingKm: Number,
    estimatedMinutesRemaining: Number,
    assignedAt: Date,
    acceptedAt: Date,
    preparingAt: Date,
    readyForPickupAt: Date,
    pickedUpAt: Date,
    shippedAt: Date,
    outForDeliveryAt: Date,
    estimatedDelivery: {
      type: String,
      default: '',
    },
    trackingTimeline: [timelineStepSchema],
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: Date,
    deliveredAt: Date,
    paidAt: Date,
    deliveryOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    refundStatus: {
      type: String,
      enum: ['None', 'Pending', 'Processed', 'Failed'],
      default: 'None',
    },
    refundAmount: Number,
    refundTransactionRef: String,
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);

