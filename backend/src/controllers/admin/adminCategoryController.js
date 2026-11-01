const Category = require('../../models/Category');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * List all categories with product counts
 * GET /api/v1/admin/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });

  // Compute product counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return {
        ...cat.toObject(),
        productCount: count,
      };
    })
  );

  return successResponse(res, categoriesWithCounts, 'Categories retrieved');
});

/**
 * Get category by ID
 * GET /api/v1/admin/categories/:id
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }
  const productCount = await Product.countDocuments({ category: category._id });
  return successResponse(res, { category, productCount }, 'Category retrieved');
});

/**
 * Create category
 * POST /api/v1/admin/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, displayOrder, subCategories, isActive } = req.body;

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
    icon: icon || 'grid',
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    subCategories: parsedSubCats,
    isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
  });

  recordAuditLog(req, 'CATEGORY_CREATED', 'categories', category._id, { name: category.name });

  return successResponse(res, category, 'Category created successfully', 201);
});

/**
 * Update category
 * PUT /api/v1/admin/categories/:id
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

  if (typeof req.body.subCategories === 'string') {
    req.body.subCategories = JSON.parse(req.body.subCategories);
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  recordAuditLog(req, 'CATEGORY_UPDATED', 'categories', category._id, { name: category.name });

  return successResponse(res, category, 'Category updated successfully');
});

/**
 * Delete category (Guards against deleting categories with active products)
 * DELETE /api/v1/admin/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  // Safety check: prevent deleting category with assigned active products
  const productCount = await Product.countDocuments({ category: category._id, isActive: true });
  if (productCount > 0) {
    return errorResponse(
      res,
      `Cannot delete category "${category.name}". It still contains ${productCount} active product(s). Please reassign or delete the products first.`,
      400
    );
  }

  await category.deleteOne();

  recordAuditLog(req, 'CATEGORY_DELETED', 'categories', category._id, { name: category.name });

  return successResponse(res, null, 'Category deleted successfully');
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

