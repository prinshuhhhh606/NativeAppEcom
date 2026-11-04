/**
 * Seller Product Management Controller
 * Strict seller-ownership checks and Admin-approval workflow
 */
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const cloudinaryService = require('../../services/cloudinaryService');
const { getIO } = require('../../sockets/socketManager');

/**
 * Upload Product Images
 * POST /api/v1/seller/products/upload-images
 */
const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'Please select at least one image to upload', 400);
  }

  const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = uploaded.map((img) => {
    if (img && img.url && img.url.startsWith('/uploads/')) {
      return `${baseUrl}${img.url}`;
    }
    return img?.url;
  }).filter(Boolean);

  return successResponse(res, { urls }, 'Images uploaded successfully', 201);
});

/**
 * List Seller Products with Filtering & Pagination
 * GET /api/v1/seller/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 50, search, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const query = { seller: sellerId };

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { productName: { $regex: s, $options: 'i' } },
      { sku: { $regex: s, $options: 'i' } },
      { brand: { $regex: s, $options: 'i' } },
      { subtitle: { $regex: s, $options: 'i' } },
    ];
  }

  if (category && category !== 'all') {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    } else {
      const catDoc = await Category.findOne({
        $or: [{ slug: category }, { name: category }, { categoryName: category }],
      });
      if (catDoc) query.category = catDoc._id;
    }
  }

  if (status && status !== 'all') {
    if (status === 'pending' || status === 'pending_approval') {
      query.approvalStatus = { $in: ['pending', 'pending_approval'] };
    } else {
      query.approvalStatus = status;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [products, totalCount] = await Promise.all([
    Product.find(query)
      .populate('category', 'name categoryName slug icon iconName')
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid product ID format', 400);
  }

  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id })
    .populate('category', 'name categoryName slug icon iconName subCategories');

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
    subCategory,
    brand,
    price,
    originalPrice,
    costPrice,
    stock = 10,
    lowStockAlert = 5,
    sku,
    variants,
    tags,
    codAvailable = true,
    transitDays = 3,
    gstPercentage = 18,
    hsnCode = '',
    weight = 0.5,
    dimensions,
    shippingInfo,
    returnPolicy,
    isDraft = false,
  } = req.body || {};

  if (!productName || !productName.trim()) {
    return errorResponse(res, 'Product Name is required', 400);
  }

  if (!description || !description.trim()) {
    return errorResponse(res, 'Product Description is required', 400);
  }

  if (price === undefined || price === null || price === '') {
    return errorResponse(res, 'Selling Price is required', 400);
  }

  // Handle uploaded images from multipart files
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    imageUrls = uploaded.map((img) => {
      if (img && img.url && img.url.startsWith('/uploads/')) {
        return `${baseUrl}${img.url}`;
      }
      return img?.url;
    }).filter(Boolean);
  }

  // Handle images passed as URLs or array in body
  let bodyImages = req.body.images;
  if (typeof bodyImages === 'string') {
    try {
      bodyImages = JSON.parse(bodyImages);
    } catch (e) {
      bodyImages = bodyImages.split(',').map((u) => u.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(bodyImages)) {
    imageUrls = [...imageUrls, ...bodyImages.filter((u) => u && typeof u === 'string' && u.trim().length > 0)];
  }

  // Ensure unique images
  imageUrls = Array.from(new Set(imageUrls));

  if (imageUrls.length === 0) {
    imageUrls = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'];
  }

  // Resolve Category
  let categoryDoc = null;
  if (category && mongoose.Types.ObjectId.isValid(category)) {
    categoryDoc = await Category.findById(category);
  }
  if (!categoryDoc && category) {
    categoryDoc = await Category.findOne({
      $or: [
        { slug: category },
        { name: new RegExp(`^${category}$`, 'i') },
        { categoryName: new RegExp(`^${category}$`, 'i') },
      ],
    });
  }
  if (!categoryDoc) {
    // Fallback to first active category
    categoryDoc = await Category.findOne({ isActive: true });
    if (!categoryDoc) {
      return errorResponse(res, 'No categories exist in the system. Please contact the administrator.', 400);
    }
  }

  // Generate unique slug
  const cleanName = productName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const generatedSlug = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Generate or sanitize SKU
  const cleanSku =
    sku && sku.trim()
      ? sku.trim().toUpperCase()
      : `SKU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Verify unique SKU if provided
  const existingSku = await Product.findOne({ sku: cleanSku });
  if (existingSku) {
    return errorResponse(res, `Product SKU ${cleanSku} is already in use. Please enter a unique SKU.`, 409);
  }

  // Parse Highlights
  let parsedHighlights = highlights;
  if (typeof parsedHighlights === 'string') {
    try {
      parsedHighlights = JSON.parse(parsedHighlights);
    } catch (e) {
      parsedHighlights = parsedHighlights.split(',').map((h) => h.trim()).filter(Boolean);
    }
  }

  // Parse Variants
  let parsedVariants = { colors: [], sizes: [] };
  if (typeof variants === 'string') {
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {}
  } else if (variants && typeof variants === 'object') {
    parsedVariants = {
      colors: Array.isArray(variants.colors) ? variants.colors : [],
      sizes: Array.isArray(variants.sizes) ? variants.sizes : [],
    };
  }

  // Parse Tags
  let parsedTags = tags;
  if (typeof parsedTags === 'string') {
    try {
      parsedTags = JSON.parse(parsedTags);
    } catch (e) {
      parsedTags = parsedTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  // Parse Dimensions & Shipping Info
  let parsedDimensions = { length: 0, width: 0, height: 0 };
  if (typeof dimensions === 'string') {
    try { parsedDimensions = JSON.parse(dimensions); } catch (e) {}
  } else if (dimensions && typeof dimensions === 'object') {
    parsedDimensions = dimensions;
  }

  let parsedShipping = { transitDays: Number(transitDays) || 3, shippingCharge: 0, freeShipping: true };
  if (typeof shippingInfo === 'string') {
    try { parsedShipping = JSON.parse(shippingInfo); } catch (e) {}
  } else if (shippingInfo && typeof shippingInfo === 'object') {
    parsedShipping = shippingInfo;
  }

  let parsedReturn = { returnable: true, returnPeriodDays: 7 };
  if (typeof returnPolicy === 'string') {
    try { parsedReturn = JSON.parse(returnPolicy); } catch (e) {}
  } else if (returnPolicy && typeof returnPolicy === 'object') {
    parsedReturn = returnPolicy;
  }

  const numericPrice = Number(price);
  const numericMrp = originalPrice ? Number(originalPrice) : numericPrice;
  const numericCost = costPrice ? Number(costPrice) : 0;

  const product = await Product.create({
    productName: productName.trim(),
    subtitle: (subtitle || '').trim(),
    slug: generatedSlug,
    description: description.trim(),
    highlights: Array.isArray(parsedHighlights) ? parsedHighlights : [],
    category: categoryDoc._id,
    subCategory: (subCategory || '').trim(),
    brand: (brand || req.seller.storeName || 'Bharat Bazaar Artisans').trim(),
    images: imageUrls,
    price: numericPrice,
    originalPrice: numericMrp >= numericPrice ? numericMrp : numericPrice,
    costPrice: numericCost,
    stock: Number(stock) || 0,
    lowStockAlert: Number(lowStockAlert) || 5,
    sku: cleanSku,
    variants: parsedVariants,
    tags: Array.isArray(parsedTags) ? parsedTags : [],
    codAvailable: codAvailable === true || codAvailable === 'true',
    transitDays: Number(transitDays) || 3,
    gstPercentage: Number(gstPercentage) || 18,
    hsnCode: (hsnCode || '').trim(),
    weight: Number(weight) || 0.5,
    dimensions: parsedDimensions,
    shippingInfo: parsedShipping,
    returnPolicy: parsedReturn,
    seller: req.seller._id,
    approvalStatus: isDraft ? 'draft' : 'approved',
    isActive: !isDraft,
    publishedAt: !isDraft ? new Date() : null,
  });

  const populatedProduct = await Product.findById(product._id).populate('category', 'name categoryName slug icon iconName');

  return successResponse(
    res,
    populatedProduct,
    isDraft ? 'Product saved as Draft' : 'Product published directly to your store successfully!',
    201
  );
});

/**
 * Update Seller Product
 * PUT /api/v1/seller/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid product ID', 400);
  }

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
    subCategory,
    brand,
    price,
    originalPrice,
    costPrice,
    stock,
    lowStockAlert,
    sku,
    variants,
    tags,
    codAvailable,
    transitDays,
    gstPercentage,
    hsnCode,
    weight,
    dimensions,
    shippingInfo,
    returnPolicy,
    resubmitForApproval,
    approvalStatus,
  } = req.body || {};

  if (productName) product.productName = productName.trim();
  if (subtitle !== undefined) product.subtitle = subtitle.trim();
  if (description) product.description = description.trim();
  if (subCategory !== undefined) product.subCategory = subCategory.trim();
  if (brand) product.brand = brand.trim();

  // Category update
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      product.category = category;
    } else {
      const catDoc = await Category.findOne({
        $or: [{ slug: category }, { name: category }, { categoryName: category }],
      });
      if (catDoc) product.category = catDoc._id;
    }
  }

  // Handle newly uploaded files
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    imageUrls = uploaded.map((img) => {
      if (img && img.url && img.url.startsWith('/uploads/')) {
        return `${baseUrl}${img.url}`;
      }
      return img?.url;
    }).filter(Boolean);
  }

  // Handle body images
  let bodyImages = req.body.images;
  if (typeof bodyImages === 'string') {
    try {
      bodyImages = JSON.parse(bodyImages);
    } catch (e) {
      bodyImages = bodyImages.split(',').map((u) => u.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(bodyImages) && bodyImages.length > 0) {
    imageUrls = [...bodyImages.filter(Boolean), ...imageUrls];
  }

  if (imageUrls.length > 0) {
    product.images = Array.from(new Set(imageUrls));
  }

  if (price !== undefined) product.price = Number(price);
  if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
  if (costPrice !== undefined) product.costPrice = Number(costPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (lowStockAlert !== undefined) product.lowStockAlert = Number(lowStockAlert);

  if (sku && sku.trim().toUpperCase() !== product.sku) {
    const newSku = sku.trim().toUpperCase();
    const existingSku = await Product.findOne({ sku: newSku, _id: { $ne: product._id } });
    if (existingSku) {
      return errorResponse(res, `SKU ${newSku} is already in use by another product`, 409);
    }
    product.sku = newSku;
  }

  if (highlights !== undefined) {
    if (typeof highlights === 'string') {
      try { product.highlights = JSON.parse(highlights); } catch (e) {
        product.highlights = highlights.split(',').map((h) => h.trim()).filter(Boolean);
      }
    } else if (Array.isArray(highlights)) {
      product.highlights = highlights;
    }
  }

  if (variants !== undefined) {
    if (typeof variants === 'string') {
      try { product.variants = JSON.parse(variants); } catch (e) {}
    } else if (typeof variants === 'object') {
      product.variants = variants;
    }
  }

  if (tags !== undefined) {
    if (typeof tags === 'string') {
      try { product.tags = JSON.parse(tags); } catch (e) {
        product.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    } else if (Array.isArray(tags)) {
      product.tags = tags;
    }
  }

  if (codAvailable !== undefined) product.codAvailable = codAvailable === true || codAvailable === 'true';
  if (transitDays !== undefined) product.transitDays = Number(transitDays);
  if (gstPercentage !== undefined) product.gstPercentage = Number(gstPercentage);
  if (hsnCode !== undefined) product.hsnCode = hsnCode.trim();
  if (weight !== undefined) product.weight = Number(weight);

  if (dimensions !== undefined) {
    if (typeof dimensions === 'string') {
      try { product.dimensions = JSON.parse(dimensions); } catch (e) {}
    } else if (typeof dimensions === 'object') {
      product.dimensions = dimensions;
    }
  }

  if (shippingInfo !== undefined) {
    if (typeof shippingInfo === 'string') {
      try { product.shippingInfo = JSON.parse(shippingInfo); } catch (e) {}
    } else if (typeof shippingInfo === 'object') {
      product.shippingInfo = shippingInfo;
    }
  }

  if (returnPolicy !== undefined) {
    if (typeof returnPolicy === 'string') {
      try { product.returnPolicy = JSON.parse(returnPolicy); } catch (e) {}
    } else if (typeof returnPolicy === 'object') {
      product.returnPolicy = returnPolicy;
    }
  }

  // Handle status update / direct publishing for approved sellers
  if (approvalStatus === 'draft' || req.body.isDraft === true) {
    product.approvalStatus = 'draft';
    product.isActive = false;
  } else if (approvalStatus === 'approved' || req.body.isDraft === false) {
    product.approvalStatus = 'approved';
    product.isActive = true;
    product.rejectionReason = '';
    if (!product.publishedAt) product.publishedAt = new Date();
  } else if (resubmitForApproval || approvalStatus === 'pending_approval' || approvalStatus === 'pending') {
    product.approvalStatus = 'approved'; // Approved sellers publish directly
    product.isActive = true;
    product.rejectionReason = '';
    if (!product.publishedAt) product.publishedAt = new Date();
  }

  await product.save();

  const updatedDoc = await Product.findById(product._id).populate('category', 'name categoryName slug icon iconName');
  return successResponse(res, updatedDoc, 'Product updated successfully');
});

/**
 * Delete Product
 * DELETE /api/v1/seller/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid product ID', 400);
  }

  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Product not found or access denied', 404);
  }

  await Product.deleteOne({ _id: product._id });
  return successResponse(res, { deletedId: product._id }, 'Product deleted successfully');
});

/**
 * Submit Product for Approval
 * PATCH /api/v1/seller/products/:id/submit
 */
const submitForApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Validate the product ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid product ID format', 400);
  }

  // 2. Verify product existence and authenticated seller ownership
  const product = await Product.findOne({ _id: id, seller: req.seller._id });
  if (!product) {
    const existing = await Product.findById(id);
    if (existing) {
      return errorResponse(res, 'Access denied: You can only submit products belonging to your store', 403);
    }
    return errorResponse(res, 'Product not found', 404);
  }

  // 3. Prevent duplicate submission if already pending admin review
  if (product.approvalStatus === 'pending' || product.approvalStatus === 'pending_approval') {
    return errorResponse(res, 'Product is already submitted and pending admin review', 400);
  }

  // 4. Validate required basic fields
  if (!product.productName || !product.productName.trim()) {
    return errorResponse(res, 'Product title/name is required before submission', 400);
  }

  if (!product.description || !product.description.trim()) {
    return errorResponse(res, 'Product description is required before submission', 400);
  }

  if (!product.category) {
    return errorResponse(res, 'Product category is required before submission', 400);
  }

  const categoryDoc = await Category.findById(product.category);
  if (!categoryDoc) {
    return errorResponse(res, 'Assigned product category is invalid or no longer exists', 400);
  }

  // 5. Validate images, pricing and stock
  if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
    return errorResponse(res, 'Product must have at least one image before submission for review', 400);
  }

  if (typeof product.price !== 'number' || product.price <= 0) {
    return errorResponse(res, 'Product selling price must be greater than 0', 400);
  }

  if (product.originalPrice && product.originalPrice < product.price) {
    return errorResponse(res, 'Original MRP cannot be less than the selling price', 400);
  }

  if (typeof product.stock !== 'number' || product.stock < 0) {
    return errorResponse(res, 'Product stock quantity cannot be negative', 400);
  }

  // 6. Update product status, submission timestamp, and seller verification
  const now = new Date();
  product.approvalStatus = 'pending';
  product.submittedAt = now;
  product.seller = req.seller._id;
  product.rejectionReason = '';
  await product.save();

  // 7. Notify Admin room in real-time
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('new_product_for_approval', {
        productId: product._id,
        productName: product.productName,
        sellerId: req.seller._id,
        sellerName: req.seller.storeName || req.seller.name || 'Store Partner',
        submittedAt: now,
      });
    }
  } catch (e) {}

  // 8. Return success response
  return successResponse(res, product, 'Product submitted successfully for admin review.', 200);
});

/**
 * Product lookup by Barcode / QR Code
 * GET /api/v1/seller/products/lookup/:code
 */
const lookupProductByBarcode = asyncHandler(async (req, res) => {
  const code = (req.params.code || '').trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(code);

  const product = await Product.findOne({
    seller: req.seller._id,
    $or: [
      { sku: new RegExp(`^${code}$`, 'i') },
      { barcode: new RegExp(`^${code}$`, 'i') },
      ...(isObjectId ? [{ _id: code }] : []),
    ],
  }).populate('category', 'name categoryName slug');

  if (!product) {
    return errorResponse(res, `No product found matching barcode/SKU '${code}' in your store catalog`, 404);
  }

  return successResponse(res, product, 'Product found via barcode scan');
});

/**
 * Adjust Stock through barcode scan
 * POST /api/v1/seller/products/barcode-stock-adjust
 */
const adjustStockByBarcode = asyncHandler(async (req, res) => {
  const { code, delta, newStock } = req.body || {};
  const isObjectId = mongoose.Types.ObjectId.isValid(code);

  const product = await Product.findOne({
    seller: req.seller._id,
    $or: [
      { sku: new RegExp(`^${code}$`, 'i') },
      { barcode: new RegExp(`^${code}$`, 'i') },
      ...(isObjectId ? [{ _id: code }] : []),
    ],
  });

  if (!product) {
    return errorResponse(res, 'Product not found for scanning update', 404);
  }

  if (newStock !== undefined) {
    product.stock = Math.max(0, Number(newStock));
  } else if (delta !== undefined) {
    product.stock = Math.max(0, product.stock + Number(delta));
  }

  await product.save();
  return successResponse(res, { stock: product.stock, sku: product.sku, productId: product._id }, 'Stock adjusted via scan successfully');
});

module.exports = {
  uploadProductImages,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitForApproval,
  lookupProductByBarcode,
  adjustStockByBarcode,
};
