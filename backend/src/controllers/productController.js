const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const SearchAnalytics = require('../models/SearchAnalytics');
const RecentlyViewed = require('../models/RecentlyViewed');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * Get all products with extensive Pan India filtering, search, sorting & pagination
 * GET /api/products
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const {
    category,
    subCategory,
    minPrice,
    maxPrice,
    brand,
    rating,
    inStock,
    isFeatured,
    isTrending,
    isBestSeller,
    isNewArrival,
    specialOffer,
    minDiscount,
    discountPercent,
    search,
    sortBy,
  } = req.query;

  const filter = { isActive: true };

  // Category filter by ID or slug
  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) filter.category = catDoc._id;
    }
  }

  if (subCategory) {
    filter.subCategory = subCategory;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Brand filter
  if (brand) {
    const brands = brand.split(',').map((b) => b.trim());
    filter.brand = { $in: brands };
  }

  // Rating filter
  if (rating) {
    filter.ratings = { $gte: Number(rating) };
  }

  // In stock filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Minimum discount filter
  const disc = Number(minDiscount || discountPercent);
  if (disc > 0) {
    filter.discountPercent = { $gte: disc };
  }

  // Badges & flags
  if (isFeatured === 'true') filter.isFeatured = true;
  if (isTrending === 'true') filter.isTrending = true;
  if (isBestSeller === 'true') filter.isBestSeller = true;
  if (isNewArrival === 'true') filter.isNewArrival = true;
  if (specialOffer === 'true') {
    filter.discountPrice = { $exists: true, $gt: 0 };
  }

  // Search keyword (text index or regex on productName, name, brand, tags)
  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { productName: searchRegex },
      { name: searchRegex },
      { brand: searchRegex },
      { tags: searchRegex },
      { description: searchRegex },
    ];
  }

  // Sort order
  let sortOption = { createdAt: -1 };
  if (sortBy === 'price_asc') sortOption = { price: 1 };
  else if (sortBy === 'price_desc') sortOption = { price: -1 };
  else if (sortBy === 'rating_desc') sortOption = { ratings: -1 };
  else if (sortBy === 'newest') sortOption = { createdAt: -1 };
  else if (sortBy === 'popularity') sortOption = { numOfReviews: -1, ratings: -1 };
  else if (sortBy === 'discount_desc') sortOption = { discountPercent: -1, price: 1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug image')
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  // Track search query analytics asynchronously
  if (search && search.trim().length >= 2) {
    SearchAnalytics.findOneAndUpdate(
      { query: search.trim().toLowerCase() },
      {
        $inc: { count: 1 },
        $set: { lastResultCount: total, lastSearchedAt: new Date() },
      },
      { upsert: true }
    ).catch(() => {});
  }

  return successResponse(res, products, 'Products retrieved successfully', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');

  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found or currently unavailable', 404);
  }

  // Fetch related products in the same category
  const relatedProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(6)
    .select('name price discountPrice discountPercent images ratings numOfReviews brand');

  return successResponse(res, { product, relatedProducts }, 'Product details retrieved');
});

/**
 * Get product by Slug
 * GET /api/products/slug/:slug
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  return successResponse(res, { product }, 'Product details retrieved');
});

/**
 * Get featured products
 * GET /api/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name')
    .limit(limit);

  return successResponse(res, products, 'Featured products retrieved');
});

/**
 * Get trending products
 * GET /api/products/trending
 */
const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await Product.find({ isTrending: true, isActive: true })
    .populate('category', 'name')
    .limit(limit);

  return successResponse(res, products, 'Trending products retrieved');
});

/**
 * Get best seller products
 * GET /api/products/best-sellers
 */
const getBestSellers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .populate('category', 'name')
    .limit(limit);

  return successResponse(res, products, 'Best seller products retrieved');
});

/**
 * Get new arrivals
 * GET /api/products/new-arrivals
 */
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate('category', 'name')
    .limit(limit);

  return successResponse(res, products, 'New arrivals retrieved');
});

/**
 * Get special offers / discounted products
 * GET /api/products/special-offers
 */
const getSpecialOffers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await Product.find({
    discountPrice: { $gt: 0 },
    isActive: true,
  })
    .sort({ discountPercent: -1 })
    .populate('category', 'name')
    .limit(limit);

  return successResponse(res, products, 'Special offers retrieved');
});

/**
 * [Admin] Create a new product
 * POST /api/products
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
  } = req.body;

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    images = uploaded.map((img) => img.url);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  // Parse JSON string fields if passed via multipart/form-data
  const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants || [];
  const parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications || [];
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    category,
    subCategory,
    brand,
    stock: stock !== undefined ? Number(stock) : 0,
    sku,
    images,
    variants: parsedVariants,
    specifications: parsedSpecs,
    tags: parsedTags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isTrending: isTrending === 'true' || isTrending === true,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
  });

  return successResponse(res, product, 'Product created successfully', 201);
});

/**
 * [Admin] Update product
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadMultipleImages(req.files, 'products');
    const newImageUrls = uploaded.map((img) => img.url);
    req.body.images = [...(product.images || []), ...newImageUrls];
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, product, 'Product updated successfully');
});

/**
 * [Admin] Delete product (soft delete)
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  product.isActive = false;
  await product.save();

  return successResponse(res, null, 'Product deactivated successfully');
});

/**
 * Get Instant Search Suggestions & Auto-Complete Chips
 * GET /api/products/search/suggestions?q=...
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q || q.length < 2) {
    const popular = await SearchAnalytics.find().sort({ count: -1 }).limit(8).select('query');
    return successResponse(
      res,
      popular.map((p) => p.query),
      'Popular search queries'
    );
  }

  const regex = new RegExp(q, 'i');
  const [matchingProducts, matchingCategories] = await Promise.all([
    Product.find({
      isActive: true,
      $or: [{ productName: regex }, { name: regex }, { brand: regex }],
    })
      .limit(6)
      .select('productName name brand'),
    Category.find({ categoryName: regex }).limit(3).select('categoryName slug'),
  ]);

  const suggestions = new Set();
  matchingProducts.forEach((p) => {
    if (p.productName) suggestions.add(p.productName);
    if (p.name) suggestions.add(p.name);
    if (p.brand) suggestions.add(p.brand);
  });
  matchingCategories.forEach((c) => {
    if (c.categoryName) suggestions.add(c.categoryName);
  });

  return successResponse(res, Array.from(suggestions).slice(0, 8), 'Search suggestions');
});

/**
 * Personalized & Trending Product Recommendations
 * GET /api/products/recommendations
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const limit = parseInt(req.query.limit, 10) || 8;
  const categoryIds = [];

  if (userId) {
    const [recentView, recentOrders] = await Promise.all([
      RecentlyViewed.findOne({ user: userId }).populate('items.product', 'category'),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(3).select('items'),
    ]);

    if (recentView?.items?.length) {
      recentView.items.forEach((it) => {
        if (it.product?.category) categoryIds.push(it.product.category);
      });
    }

    if (recentOrders?.length) {
      recentOrders.forEach((o) => {
        o.items?.forEach((i) => {
          if (i.product) categoryIds.push(i.product);
        });
      });
    }
  }

  const filter = { isActive: true };
  if (categoryIds.length > 0) {
    filter.category = { $in: categoryIds };
  } else {
    filter.$or = [{ isBestSeller: true }, { isTrending: true }, { ratings: { $gte: 4.2 } }];
  }

  let recommended = await Product.find(filter)
    .populate('category', 'categoryName name')
    .limit(limit)
    .sort({ ratings: -1, numOfReviews: -1 });

  if (recommended.length < 4) {
    recommended = await Product.find({ isActive: true })
      .populate('category', 'categoryName name')
      .sort({ ratings: -1, createdAt: -1 })
      .limit(limit);
  }

  return successResponse(res, recommended, 'Product recommendations');
});

/**
 * Record Product View in Customer History
 * POST /api/products/recently-viewed
 */
const recordRecentlyViewed = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return errorResponse(res, 'Product ID is required', 400);
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (req.user) {
    let rv = await RecentlyViewed.findOne({ user: req.user._id });
    if (!rv) {
      rv = new RecentlyViewed({ user: req.user._id, items: [] });
    }

    // Deduplicate: filter out previous entry for this product
    rv.items = rv.items.filter((i) => i.product.toString() !== productId.toString());
    // Add to front with fresh timestamp
    rv.items.unshift({ product: productId, viewedAt: new Date() });
    // Limit to 25 items
    if (rv.items.length > 25) {
      rv.items = rv.items.slice(0, 25);
    }
    await rv.save();
  }

  return successResponse(res, null, 'View recorded successfully');
});

/**
 * Get Customer Recently Viewed Products
 * GET /api/products/recently-viewed
 */
const getRecentlyViewed = asyncHandler(async (req, res) => {
  if (!req.user) {
    return successResponse(res, [], 'Guest recently viewed empty');
  }

  const rv = await RecentlyViewed.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    match: { isActive: true },
    select: 'productName name price originalPrice images ratings category brand stock',
  });

  if (!rv || !rv.items) {
    return successResponse(res, [], 'No recently viewed products');
  }

  // Filter out any products that were deleted or deactivated
  const validItems = rv.items
    .filter((i) => i.product !== null && i.product !== undefined)
    .map((i) => ({
      ...i.product.toObject(),
      viewedAt: i.viewedAt,
    }));

  return successResponse(res, validItems, 'Recently viewed products retrieved');
});

/**
 * Clear Recently Viewed History
 * DELETE /api/products/recently-viewed
 */
const clearRecentlyViewed = asyncHandler(async (req, res) => {
  if (req.user) {
    await RecentlyViewed.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );
  }
  return successResponse(res, null, 'Recently viewed history cleared');
});

/**
 * [Admin] Search Analytics Overview
 * GET /api/v1/admin/analytics/searches
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
  getAllProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellers,
  getNewArrivals,
  getSpecialOffers,
  getSearchSuggestions,
  getRecommendations,
  recordRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed,
  getSearchAnalytics,
  createProduct,
  updateProduct,
  deleteProduct,
};

