/**
 * Delivery Address Mongoose Model
 * Validated for Indian postal addresses & 6-digit PIN codes
 */
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Recipient full name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
      trim: true,
    },
    alternateMobileNumber: {
      type: String,
      trim: true,
      default: '',
    },
    addressLine1: {
      type: String,
      required: [true, 'Flat, house no., building or company is required'],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City / District is required'],
      trim: true,
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      required: [true, 'Indian State or Union Territory is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, '6-digit Indian PIN code is required'],
      match: [/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian postal code'],
      index: true,
    },
    addressType: {
      type: String,
      enum: ['Home', 'Work', 'Other', 'home', 'work', 'other'],
      default: 'Home',
      set: (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : 'Home'),
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

addressSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

addressSchema.virtual('phone').get(function () {
  return this.mobileNumber;
});

addressSchema.virtual('streetAddress').get(function () {
  return this.addressLine1;
});

addressSchema.virtual('pincode').get(function () {
  return this.pinCode;
});

module.exports = mongoose.model('Address', addressSchema);

