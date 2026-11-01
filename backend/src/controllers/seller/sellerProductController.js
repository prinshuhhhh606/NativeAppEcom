/**
 * Seller Product Management Controller
 * Strict seller-ownership checks and Admin-approval workflow
 */
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { getIO } = require('../../sockets/socketManager');

/**
 * List Seller Products with Filtering & Pagination
 * GET /api/v1/seller/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 10, search, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const query = { seller: sellerId };

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (status && status !== 'all') {
    query.approvalStatus = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [products, totalCount] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  return successResponse(
    res,
    products,
    'Seller products fetched',
    200,
    {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
    }
  );
});

/**
 * Get Single Seller Product Details
 * GET /api/v1/seller/products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id }).populate('category', 'name slug');
  if (!product) {
    return errorResponse(res, 'Product not found or access denied', 404);
  }
  return successResponse(res, product, 'Product details retrieved');
});

/**
 * Create Product by Seller (Draft or Submitted for Admin Approval)
 * POST /api/v1/seller/products
 */
const createProduct = asyncHandler(async (req, res) => {
  if (req.seller.status !== 'approved') {
    return errorResponse(
      res,
      `Only approved sellers can upload products. Your current account status is: ${req.seller.status}.`,
      403
    );
  }

  const {
    productName,
    subtitle,
    description,
    highlights,
    category,
    brand,
    images = [],
    price,
    originalPrice,
    stock = 10,
    sku,
    variants = { colors: [], sizes: [] },
    tags = [],
    codAvailable = true,
    transitDays = 3,
    gstPercentage = 18,
    hsnCode = '',
    weight = 0.5,
    isDraft = false,
  } = req.body || {};

  if (!productName || !description || !category || !price || !originalPrice) {
    return errorResponse(res, 'Product Name, Description, Category, Selling Price and MRP are required', 400);
  }

  // Ensure category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return errorResponse(res, 'Invalid Category ID provided', 400);
  }

  const generatedSlug =
    productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  const cleanSku =
    sku && sku.trim()
      ? sku.trim().toUpperCase()
      : 'SKU-' + Math.floor(100000 + Math.random() * 900000);

  // Check unique SKU
  const existingSku = await Product.findOne({ sku: cleanSku });
  if (existingSku) {
    return errorResponse(res, `Product SKU ${cleanSku} is already in use. Please enter a unique SKU.`, 409);
  }

  const product = await Product.create({
    productName: productName.trim(),
    subtitle: subtitle || '',
    slug: generatedSlug,
    description: description.trim(),
    highlights: Array.isArray(highlights) ? highlights : [],
    category,
    brand: brand || req.seller.storeName || 'Bharat Bazaar Artisans',
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
    price: Number(price),
    originalPrice: Number(originalPrice),
    stock: Number(stock),
    sku: cleanSku,
    variants,
    tags: Array.isArray(tags) ? tags : [],
    codAvailable,
    transitDays: Number(transitDays) || 3,
    gstPercentage: Number(gstPercentage) || 18,
    hsnCode: hsnCode.trim(),
    weight: Number(weight) || 0.5,
    seller: req.seller._id,
    approvalStatus: isDraft ? 'draft' : 'pending_approval',
    isActive: !isDraft,
  });

  // Notify Admin of new product submission
  if (!isDraft) {
    try {
      const io = getIO();
      if (io) {
        io.to('admin_room').emit('new_product_for_approval', {
          productId: product._id,
          productName: product.productName,
          sellerName: req.seller.name,
          storeName: req.seller.storeName,
          submittedAt: new Date(),
        });
      }
    } catch (e) {}
  }

  return successResponse(
    res,
    product,
    isDraft ? 'Product saved as Draft' : 'Product submitted for Admin approval successfully',
    201
  );
});

/**
 * Update Seller Product
 * PUT /api/v1/seller/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Product not found or access denied', 404);
  }

  const {
    productName,
    subtitle,
    description,
    highlights,
    category,
    brand,
    images,
    price,
    originalPrice,
    stock,
    sku,
    variants,
    tags,
    codAvailable,
    transitDays,
    gstPercentage,
    hsnCode,
    weight,
    resubmitForApproval,
  } = req.body || {};

  if (productName) product.productName = productName.trim();
  if (subtitle !== undefined) product.subtitle = subtitle;
  if (description) product.description = description.trim();
  if (highlights) product.highlights = highlights;
  if (category) product.category = category;
  if (brand) product.brand = brand.trim();
  if (images && images.length > 0) product.images = images;
  if (price !== undefined) product.price = Number(price);
  if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (sku) product.sku = sku.trim().toUpperCase();
  if (variants) product.variants = variants;
  if (tags) product.tags = tags;
  if (codAvailable !== undefined) product.codAvailable = codAvailable;
  if (transitDays !== undefined) product.transitDays = Number(transitDays);
  if (gstPercentage !== undefined) product.gstPercentage = Number(gstPercentage);
  if (hsnCode !== undefined) product.hsnCode = hsnCode.trim();
  if (weight !== undefined) product.weight = Number(weight);

  // If rejected or draft, allow resubmission
  if (resubmitForApproval && (product.approvalStatus === 'rejected' || product.approvalStatus === 'draft')) {
    product.approvalStatus = 'pending_approval';
    product.rejectionReason = '';
  }

  await product.save();

  return successResponse(res, product, 'Product updated successfully');
});

/**
 * Delete Product
 * DELETE /api/v1/seller/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Product not found or access denied', 404);
  }

  await Product.deleteOne({ _id: product._id });
  return successResponse(res, null, 'Product deleted successfully');
});

/**
 * Submit Product for Approval
 * PATCH /api/v1/seller/products/:id/submit
 */
const submitForApproval = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  product.approvalStatus = 'pending_approval';
  product.rejectionReason = '';
  await product.save();

  // Notify Admin via Socket
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('new_product_for_approval', {
        productId: product._id,
        productName: product.productName,
        sellerName: req.seller.name,
        submittedAt: new Date(),
      });
    }
  } catch (e) {}

  return successResponse(res, product, 'Product submitted to Admin for approval');
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitForApproval,
};

