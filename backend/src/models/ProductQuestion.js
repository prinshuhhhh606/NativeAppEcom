/**
 * Product Question & Answer Mongoose Model
 * Allows customers to ask product questions and sellers/admins to answer
 */
const mongoose = require('mongoose');

const productQuestionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters'],
      maxlength: [500, 'Question cannot exceed 500 characters'],
    },
    answer: {
      type: String,
      default: '',
      trim: true,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
    answeredAt: {
      type: Date,
    },
    isAnswered: {
      type: Boolean,
      default: false,
      index: true,
    },
    isReported: {
      type: Boolean,
      default: false,
      index: true,
    },
    reportReason: {
      type: String,
      default: '',
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'hidden', 'flagged'],
      default: 'approved',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productQuestionSchema.index({ product: 1, isAnswered: 1, createdAt: -1 });

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);

