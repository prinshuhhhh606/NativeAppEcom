const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Inventory = require('../../models/Inventory');
const InventoryTransaction = require('../../models/InventoryTransaction');
const SearchAnalytics = require('../../models/SearchAnalytics');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * List products with filters, search, sorting & pagination
 * GET /api/v1/admin/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { search, category, stockStatus, status, sortBy = 'createdAt_desc' } = req.query;
  const query = {};

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { sku: regex }, { brand: regex }];
  }

  if (category) {
    query.category = category;
  }

  if (status === 'published') {
    query.isActive = true;
  } else if (status === 'draft') {
    query.isActive = false;
  }

  if (stockStatus === 'out_of_stock') {
    query.stock = 0;
  } else if (stockStatus === 'low_stock') {
    query.stock = { $gt: 0, $lte: 10 };
  } else if (stockStatus === 'in_stock') {
    query.stock = { $gt: 10 };
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === 'price_asc') sort = { price: 1 };
  else if (sortBy === 'price_desc') sort = { price: -1 };
  else if (sortBy === 'stock_asc') sort = { stock: 1 };
  else if (sortBy === 'stock_desc') sort = { stock: -1 };
  else if (sortBy === 'name_asc') sort = { name: 1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return successResponse(res, products, 'Products retrieved successfully', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get product by ID
 * GET /api/v1/admin/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }
  const inventory = await Inventory.findOne({ product: product._id });
  return successResponse(res, { product, inventory }, 'Product details retrieved');
});

/**
 * Create a new Product
 * POST /api/v1/admin/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    discountPrice,
    category,
    subCategory,
    brand,
    stock,
    sku,
    variants,
    specifications,
    tags,
    isFeatured,
    isTrending,
    isBestSeller,
    isActive = true,
  } = req.body;

  // SKU validation
  const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
  const existingSku = await Product.findOne({ sku: generatedSku });
  if (existingSku) {
    return errorResponse(res, `Product with SKU "${generatedSku}" already exists`, 400);
  }

  // Handle uploaded images
  let images = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    images = uploaded.map((img) => img.url);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  // Parse JSON fields if needed
  const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants || [];
  const parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications || [];
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

  const initialStock = stock !== undefined ? Number(stock) : 0;

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    category,
    subCategory,
    brand,
    stock: initialStock,
    sku: generatedSku,
    images,
    variants: parsedVariants,
    specifications: parsedSpecs,
    tags: parsedTags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isTrending: isTrending === 'true' || isTrending === true,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
    isActive: isActive === 'true' || isActive === true,
  });

  // Create linked Inventory record
  const invRecord = await Inventory.create({
    product: product._id,
    sku: product.sku,
    currentStock: initialStock,
  });

  // Log initial stock transaction
  if (initialStock > 0) {
    await InventoryTransaction.create({
      product: product._id,
      inventory: invRecord._id,
      sku: product.sku,
      type: 'STOCK_IN',
      previousQuantity: 0,
      newQuantity: initialStock,
      changeQuantity: initialStock,
      reason: 'Initial Product Creation',
      admin: req.admin?._id,
    });
  }

  recordAuditLog(req, 'PRODUCT_CREATED', 'products', product._id, { name: product.name, sku: product.sku });

  return successResponse(res, product, 'Product created successfully', 201);
});

/**
 * Update Product
 * PUT /api/v1/admin/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Image handling
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    const newImageUrls = uploaded.map((img) => img.url);
    req.body.images = [...(product.images || []), ...newImageUrls];
  }

  // Handle parsed fields
  if (typeof req.body.variants === 'string') req.body.variants = JSON.parse(req.body.variants);
  if (typeof req.body.specifications === 'string') req.body.specifications = JSON.parse(req.body.specifications);
  if (typeof req.body.tags === 'string') req.body.tags = JSON.parse(req.body.tags);

  const prevStock = product.stock;
  product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  // Update Inventory record if stock modified
  if (req.body.stock !== undefined && Number(req.body.stock) !== prevStock) {
    const newStock = Number(req.body.stock);
    await Inventory.findOneAndUpdate(
      { product: product._id },
      { currentStock: newStock, sku: product.sku },
      { upsert: true }
    );
    await InventoryTransaction.create({
      product: product._id,
      sku: product.sku,
      type: 'ADJUSTMENT',
      previousQuantity: prevStock,
      newQuantity: newStock,
      changeQuantity: newStock - prevStock,
      reason: 'Manual Stock Update from Edit Product',
      admin: req.admin?._id,
    });
  }

  recordAuditLog(req, 'PRODUCT_UPDATED', 'products', product._id, { name: product.name });

  return successResponse(res, product, 'Product updated successfully');
});

/**
 * Delete / Deactivate Product
 * DELETE /api/v1/admin/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  product.isActive = false;
  await product.save();

  recordAuditLog(req, 'PRODUCT_DEACTIVATED', 'products', product._id, { name: product.name });

  return successResponse(res, null, 'Product deactivated successfully');
});

/**
 * Toggle Product Badges & Status (Featured, Trending, BestSeller, Active)
 * PATCH /api/v1/admin/products/:id/toggle
 */
const toggleProductFlag = asyncHandler(async (req, res) => {
  const { field } = req.body; // 'isFeatured', 'isTrending', 'isBestSeller', 'isActive'
  const product = await Product.findById(req.params.id);

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (!['isFeatured', 'isTrending', 'isBestSeller', 'isActive'].includes(field)) {
    return errorResponse(res, 'Invalid toggle field', 400);
  }

  product[field] = !product[field];
  await product.save();

  recordAuditLog(req, 'PRODUCT_TOGGLE_FLAG', 'products', product._id, { field, newValue: product[field] });

  return successResponse(res, product, `${field} updated to ${product[field]}`);
});

/**
 * Export Products to CSV format
 * GET /api/v1/admin/products/export/csv
 */
const exportProductsCSV = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 });

  const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'DiscountPrice', 'Stock', 'Brand', 'Status'];
  const rows = products.map((p) => [
    p._id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.sku,
    `"${p.category?.name || 'Uncategorized'}"`,
    p.price,
    p.discountPrice || '',
    p.stock,
    `"${p.brand || ''}"`,
    p.isActive ? 'Active' : 'Draft',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
  return res.status(200).send(csvContent);
});

/**
 * [Admin] Search Analytics Overview
 * GET /api/v1/admin/reports/searches & /api/v1/admin/analytics/searches
 */
const getSearchAnalytics = asyncHandler(async (req, res) => {
  const topSearches = await SearchAnalytics.find().sort({ count: -1 }).limit(50);
  const totalAgg = await SearchAnalytics.aggregate([
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);

  return successResponse(
    res,
    {
      topSearches,
      totalQueries: totalAgg[0]?.total || 0,
      uniqueKeywords: topSearches.length,
    },
    'Search analytics retrieved'
  );
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductFlag,
  exportProductsCSV,
  getSearchAnalytics,
};

