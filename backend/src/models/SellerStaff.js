/**
 * Seller Staff & Employee Mongoose Model
 * Manages store team members, role-based access, and shift attendance
 */
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'half_day', 'on_leave'], default: 'present' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const sellerStaffSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Staff employee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Staff employee email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'order_manager', 'inventory_manager', 'packing_staff'],
      default: 'packing_staff',
      index: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          'orders:view',
          'orders:edit',
          'orders:bulk_process',
          'inventory:view',
          'inventory:edit',
          'products:view',
          'products:edit',
          'reports:view',
          'messages:respond',
          'disputes:file',
        ],
      },
    ],
    status: {
      type: String,
      enum: ['active', 'invited', 'revoked'],
      default: 'active',
      index: true,
    },
    shift: {
      type: String,
      default: 'Regular (10:00 AM - 07:00 PM)',
    },
    attendance: [attendanceRecordSchema],
    lastLogin: {
      type: Date,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per seller store
sellerStaffSchema.index({ seller: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('SellerStaff', sellerStaffSchema);

