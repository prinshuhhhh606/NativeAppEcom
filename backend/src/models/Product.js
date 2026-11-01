/**
 * Product Mongoose Model
 */
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    colors: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
  },
  { _id: false }
);

const variantItemSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, uppercase: true },
    attributes: {
      size: { type: String, trim: true },
      color: { type: String, trim: true },
      model: { type: String, trim: true },
    },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    highlights: [{ type: String, trim: true }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Bharat Bazaar Artisans',
      index: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'A product must have at least one image',
      },
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price must be positive'],
      index: true,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original MRP is required'],
      min: [0, 'Original price must be positive'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 10,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    variants: {
      type: variantSchema,
      default: () => ({ colors: [], sizes: [] }),
    },
    variantItems: [variantItemSchema],
    ratings: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
      index: true,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String, trim: true }],
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true,
    },
    codAvailable: {
      type: Boolean,
      default: true,
    },
    transitDays: {
      type: Number,
      default: 3,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'approved',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },
    hsnCode: {
      type: String,
      default: '',
    },
    weight: {
      type: Number,
      default: 0.5, // in kg
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Full text search index
productSchema.index({ productName: 'text', subtitle: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);

