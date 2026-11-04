const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema(
  {
    franchiseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'inactive'],
      default: 'active',
    },
    serviceAreaCity: {
      type: String,
      required: true,
      trim: true,
    },
    serviceAreaState: {
      type: String,
      required: true,
      trim: true,
    },
    serviceablePincodes: {
      type: [String],
      default: [],
    },
    commissionPercentage: {
      type: Number,
      default: 3.5, // 3.5% default franchise commission
      min: 0,
      max: 100,
    },
    assignedSellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
      },
    ],
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      pendingPayouts: { type: Number, default: 0 },
      completedPayouts: { type: Number, default: 0 },
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    address: {
      addressLine: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pinCode: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for active sellers count
franchiseSchema.virtual('sellerCount').get(function () {
  return this.assignedSellers ? this.assignedSellers.length : 0;
});

module.exports = mongoose.model('Franchise', franchiseSchema);

