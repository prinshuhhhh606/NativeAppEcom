const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      enum: [
        'dashboard',
        'products',
        'categories',
        'inventory',
        'orders',
        'customers',
        'coupons',
        'payments',
        'shipping',
        'returns',
        'reviews',
        'reports',
        'settings',
        'admins',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Permission', permissionSchema);

