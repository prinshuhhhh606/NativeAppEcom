/**
 * Category Mongoose Model
 * Supports both categoryName/name, image/categoryImage, icon/iconName, and subCategories
 */
const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    categoryName: {
      type: String,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    categoryImage: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'grid-outline',
    },
    iconName: {
      type: String,
      default: 'grid-outline',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    highlight: {
      type: String,
      default: '',
    },
    subCategories: [subCategorySchema],
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to ensure name, categoryName, and slug are synchronized
categorySchema.pre('validate', function () {
  const chosenName = this.name || this.categoryName || '';
  if (!this.name) this.name = chosenName;
  if (!this.categoryName) this.categoryName = chosenName;

  if (!this.slug && chosenName) {
    this.slug = chosenName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  if (!this.image && this.categoryImage) this.image = this.categoryImage;
  if (!this.categoryImage && this.image) this.categoryImage = this.image;

  if (!this.icon && this.iconName) this.icon = this.iconName;
  if (!this.iconName && this.icon) this.iconName = this.icon;
});

module.exports = mongoose.model('Category', categorySchema);
