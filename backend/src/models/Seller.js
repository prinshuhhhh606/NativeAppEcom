/**
 * Seller (Vendor) Mongoose Model
 * Multi-Vendor E-Commerce Platform
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema(
  {
    // 1. Personal & Account Credentials
    name: {
      type: String,
      required: [true, 'Seller name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Seller email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    },

    // 2. Business Profile
    businessName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    businessType: {
      type: String,
      enum: ['individual', 'proprietorship', 'partnership', 'pvt_ltd', 'public_ltd', 'llp', 'artisan_cluster'],
      default: 'proprietorship',
    },
    businessDescription: {
      type: String,
      default: '',
    },
    storeName: {
      type: String,
      trim: true,
      default: '',
    },
    storeSlug: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    storeLogo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=300&q=80',
    },
    storeBanner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    },

    // 3. Address & Pan-India Pickup Warehouse
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Jaipur' },
      state: { type: String, default: 'Rajasthan' },
      pinCode: { type: String, default: '302001' },
      country: { type: String, default: 'India' },
      landmark: { type: String, default: '' },
    },

    // 4. Verification & KYC
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    kycDocuments: {
      panCardImage: { type: String, default: '' },
      gstCertificate: { type: String, default: '' },
      addressProof: { type: String, default: '' },
      cancelledCheque: { type: String, default: '' },
      idProof: { type: String, default: '' },
    },
    kycSubmittedAt: {
      type: Date,
    },

    // 5. Bank Account for Payout Settlements
    bankAccount: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, uppercase: true, trim: true, default: '' },
      bankName: { type: String, default: '' },
      branchName: { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
    },

    // 6. Account Status & Admin Controls
    status: {
      type: String,
      enum: ['pending', 'pending_verification', 'under_review', 'approved', 'rejected', 'suspended', 'blocked'],
      default: 'pending',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    commissionRate: {
      type: Number,
      default: 10, // Platform commission percentage
      min: [0, 'Commission cannot be negative'],
      max: [50, 'Commission cannot exceed 50%'],
    },
    franchise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      default: null,
      index: true,
    },

    // 7. Financial Balance Overview
    balance: {
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 },
    },

    // 8. Store Automation & Availability
    storeAutomation: {
      vacationMode: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'Our store is temporarily away on vacation. Orders placed will be processed upon our return.' },
        startDate: { type: Date },
        endDate: { type: Date },
      },
      operatingHours: {
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '21:00' },
        closedDays: [{ type: String }],
      },
      holidays: [
        {
          date: { type: Date },
          title: { type: String },
        },
      ],
      autoAcceptOrders: {
        enabled: { type: Boolean, default: false },
        maxOrderValue: { type: Number, default: 10000 },
      },
      orderPrepTimeMinutes: { type: Number, default: 30 },
      cutoffTime: { type: String, default: '18:00' },
      isStoreOpen: { type: Boolean, default: true },
    },

    // 9. Delivery Zones & Logistics Settings
    deliverySettings: {
      zones: [
        {
          radiusKm: { type: Number, default: 5 },
          fee: { type: Number, default: 40 },
          freeAbove: { type: Number, default: 499 },
          enabled: { type: Boolean, default: true },
        },
      ],
      sameDayDelivery: { type: Boolean, default: true },
      expressDelivery: { type: Boolean, default: false },
      scheduledSlots: [
        { slot: { type: String }, enabled: { type: Boolean, default: true } },
      ],
      partnerPreferences: {
        autoAssign: { type: Boolean, default: true },
        autoAssignTimeoutSeconds: { type: Number, default: 120 },
        maxBatchOrders: { type: Number, default: 3 },
        useOwnStaff: { type: Boolean, default: false },
      },
    },

    // 10. Accounting & Invoicing Preferences
    accountingSettings: {
      invoicePrefix: { type: String, default: 'INV-BB' },
      gstRegistered: { type: Boolean, default: true },
      legalBusinessName: { type: String, default: '' },
    },

    // 11. Security & Auth Tokens
    refreshToken: {
      type: String,
      select: false,
    },
    previousRefreshToken: {
      type: String,
      select: false,
    },
    previousRefreshTokenExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save password hashing
sellerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
sellerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate store slug if missing
sellerSchema.pre('save', function () {
  if (!this.storeSlug && this.storeName) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

module.exports = mongoose.model('Seller', sellerSchema);

