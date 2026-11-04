/**
 * User Mongoose Model
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ROLE_LIST } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      select: false, // Do not expose by default in queries
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.CUSTOMER,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: '30d' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for seamless backward compatibility across controllers and frontend
userSchema.virtual('name')
  .get(function () {
    return this.fullName;
  })
  .set(function (val) {
    this.fullName = val;
  });

userSchema.virtual('phone')
  .get(function () {
    return this.mobileNumber;
  })
  .set(function (val) {
    this.mobileNumber = val;
  });

userSchema.virtual('avatar')
  .get(function () {
    return this.profileImage;
  })
  .set(function (val) {
    this.profileImage = val;
  });

userSchema.virtual('isPhoneVerified')
  .get(function () {
    return this.isVerified;
  })
  .set(function (val) {
    this.isVerified = val;
  });

userSchema.virtual('isEmailVerified')
  .get(function () {
    return this.isVerified;
  })
  .set(function (val) {
    this.isVerified = val;
  });

userSchema.virtual('password')
  .set(function (plainPassword) {
    this._plainPassword = plainPassword;
  });

// Pre-validate hook: if name or phone are provided on payload, bridge to fullName and mobileNumber
userSchema.pre('validate', function () {
  if (!this.fullName && this.name) {
    this.fullName = this.name;
  }
  if (!this.mobileNumber && this.phone) {
    this.mobileNumber = this.phone;
  }
});

// Pre-save hook: hash plain password if set via virtual or assignment
userSchema.pre('save', async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
});

// Method to verify password (supports both comparePassword and matchPassword)
userSchema.methods.comparePassword = async function (enteredPassword) {
  const hash = this.passwordHash;
  if (!hash) return false;
  return await bcrypt.compare(enteredPassword, hash);
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await this.comparePassword(enteredPassword);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('User', userSchema);


