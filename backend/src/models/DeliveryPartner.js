/**
 * Delivery Partner Mongoose Model
 * Comprehensive logistics and rider model for Pan-India delivery fleet
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliveryTaskSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: {
      fullName: String,
      addressLine1: String,
      city: String,
      state: String,
      pinCode: String,
    },
    paymentMethod: { type: String, default: 'UPI' },
    amountToCollect: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ['assigned', 'reached_pickup', 'picked_up', 'out_for_delivery', 'reached_customer', 'delivered', 'failed'],
      default: 'assigned',
    },
    pickupOtp: { type: String, default: '7821' },
    deliveryOtp: { type: String, default: '4521' },
    assignedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
  },
  { _id: true }
);

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Delivery partner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    },
    dob: {
      type: Date,
      default: '1995-05-15',
    },
    address: {
      addressLine: { type: String, default: 'Street 4, Karol Bagh' },
      city: { type: String, default: 'New Delhi' },
      state: { type: String, default: 'Delhi' },
      pinCode: { type: String, default: '110005' },
    },

    // Vehicle Details
    vehicleType: {
      type: String,
      enum: ['Bike', 'Scooter', 'Electric', 'Van'],
      default: 'Bike',
    },
    vehicleNumber: {
      type: String,
      default: 'DL-04-CK-8821',
      uppercase: true,
    },
    drivingLicenseNumber: {
      type: String,
      default: 'DL1420110012345',
      uppercase: true,
    },

    // KYC & Verification Status
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'blocked'],
      default: 'approved',
      index: true,
    },
    kycDocuments: {
      aadharNumber: { type: String, default: 'XXXX-XXXX-4819' },
      panNumber: { type: String, default: 'ABCDE1234F' },
      drivingLicenseDoc: { type: String, default: '' },
      vehicleRcDoc: { type: String, default: '' },
      identityProofDoc: { type: String, default: '' },
    },
    adminRemarks: {
      type: String,
      default: 'Verified Fleet Rider',
    },

    // Bank & Payout Details
    bankDetails: {
      accountHolderName: { type: String, default: 'Rajesh Kumar' },
      accountNumber: { type: String, default: '918237461928' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      bankName: { type: String, default: 'HDFC Bank' },
      upiId: { type: String, default: 'rajesh@okhdfcbank' },
    },

    // Emergency Contact
    emergencyContact: {
      name: { type: String, default: 'Suresh Kumar' },
      phone: { type: String, default: '9876543219' },
      relationship: { type: String, default: 'Brother' },
    },

    // Online / Offline Availability
    availability: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    activeCapacity: {
      type: Number,
      default: 3, // Max simultaneous active deliveries
    },
    currentActiveDeliveries: {
      type: Number,
      default: 0,
    },

    // Real-Time GPS Location
    currentLocation: {
      latitude: { type: Number, default: 28.6139 },
      longitude: { type: Number, default: 77.209 },
      addressText: { type: String, default: 'Connaught Place, New Delhi' },
      updatedAt: { type: Date, default: Date.now },
    },

    // Performance Metrics
    rating: {
      type: Number,
      default: 4.85,
    },
    acceptanceRate: {
      type: Number,
      default: 96, // percentage
    },
    completionRate: {
      type: Number,
      default: 98, // percentage
    },
    totalDeliveriesCompleted: {
      type: Number,
      default: 248,
    },

    // Wallet & Earnings
    earnings: {
      available: { type: Number, default: 1450 },
      pending: { type: Number, default: 680 },
      totalEarned: { type: Number, default: 18200 },
      todayEarned: { type: Number, default: 420 },
      weekEarned: { type: Number, default: 3250 },
      monthEarned: { type: Number, default: 14800 },
    },

    // Tasks
    assignedTasks: [deliveryTaskSchema],

    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
deliveryPartnerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
deliveryPartnerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
