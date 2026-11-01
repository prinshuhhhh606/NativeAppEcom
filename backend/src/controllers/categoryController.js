const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * Get all active categories
 * GET /api/categories
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 });

  return successResponse(res, categories, 'Categories fetched successfully');
});

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category || !category.isActive) {
    return errorResponse(res, 'Category not found', 404);
  }

  const productCount = await Product.countDocuments({ category: category._id, isActive: true });

  return successResponse(
    res,
    { category, productCount },
    'Category details retrieved'
  );
});

/**
 * Get category by slug
 * GET /api/categories/slug/:slug
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  return successResponse(res, { category }, 'Category retrieved successfully');
});

/**
 * [Admin] Create a category
 * POST /api/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, displayOrder, subCategories } = req.body;

  let image = req.body.image;
  if (req.file) {
    const uploaded = await cloudinaryService.uploadImage(req.file, 'categories');
    image = uploaded.url;
  }

  const parsedSubCats = typeof subCategories === 'string' ? JSON.parse(subCategories) : subCategories || [];

  const category = await Category.create({
    name,
    description,
    image,
    icon,
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    subCategories: parsedSubCats,
  });

  return successResponse(res, category, 'Category created successfully', 201);
});

/**
 * [Admin] Update category
 * PUT /api/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);
  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  if (req.file) {
    const uploaded = await cloudinaryService.uploadImage(req.file, 'categories');
    req.body.image = uploaded.url;
  }

  if (req.body.subCategories && typeof req.body.subCategories === 'string') {
    req.body.subCategories = JSON.parse(req.body.subCategories);
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, category, 'Category updated successfully');
});

/**
 * [Admin] Delete category
 * DELETE /api/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  category.isActive = false;
  await category.save();

  return successResponse(res, null, 'Category deactivated successfully');
});

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};

