const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get the currently active Flash Sale Campaign
 * GET /api/flash-sales/active
 */
const getActiveFlashSale = asyncHandler(async (req, res) => {
  const now = new Date();

  const sale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gt: now },
  }).populate({
    path: 'products.product',
    select: 'productName name images price originalPrice ratings brand inStock stock category',
  });

  if (!sale) {
    return successResponse(res, null, 'No active flash sale at this moment');
  }

  const remainingSeconds = Math.max(0, Math.floor((sale.endTime.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  // Filter out any out-of-quota products
  const activeProducts = sale.products
    .filter((item) => item.product && item.soldCount < item.saleStock)
    .map((item) => {
      const prodObj = item.product.toObject();
      return {
        ...prodObj,
        flashSaleItemId: item._id,
        salePrice: item.salePrice,
        originalPrice: item.originalPrice || prodObj.price,
        discountValue: item.discountValue,
        discountType: item.discountType,
        saleStock: item.saleStock,
        soldCount: item.soldCount,
        remainingSaleStock: item.saleStock - item.soldCount,
      };
    });

  return successResponse(
    res,
    {
      _id: sale._id,
      title: sale.title,
      description: sale.description,
      bannerImage: sale.bannerImage,
      startTime: sale.startTime,
      endTime: sale.endTime,
      timeLeft: { hours, minutes, seconds, totalSeconds: remainingSeconds },
      products: activeProducts,
    },
    'Active flash sale campaign retrieved'
  );
});

/**
 * [Admin] List all flash sales
 * GET /api/v1/admin/flash-sales
 */
const getAllFlashSales = asyncHandler(async (req, res) => {
  const sales = await FlashSale.find()
    .populate('products.product', 'productName name price')
    .sort({ createdAt: -1 });

  return successResponse(res, sales, 'Flash sales retrieved');
});

/**
 * [Admin] Create a new Flash Sale Campaign
 * POST /api/v1/admin/flash-sales
 */
const createFlashSale = asyncHandler(async (req, res) => {
  const { title, description, bannerImage, startTime, endTime, products } = req.body;

  if (!title || !startTime || !endTime || !Array.isArray(products) || products.length === 0) {
    return errorResponse(res, 'Title, startTime, endTime and products are required', 400);
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return errorResponse(res, 'End time must be after start time', 400);
  }

  // Validate products and compute sale prices
  const productDocs = await Product.find({ _id: { $in: products.map((p) => p.productId || p.product) } });
  const productMap = new Map(productDocs.map((p) => [p._id.toString(), p]));

  const validatedProducts = [];
  for (const item of products) {
    const pId = (item.productId || item.product).toString();
    const product = productMap.get(pId);
    if (!product) continue;

    const discountVal = Number(item.discountValue || 20);
    const discType = item.discountType || 'percentage';
    let salePrice = product.price;

    if (discType === 'percentage') {
      salePrice = Math.round(product.price * (1 - discountVal / 100));
    } else {
      salePrice = Math.max(1, product.price - discountVal);
    }

    validatedProducts.push({
      product: product._id,
      discountType: discType,
      discountValue: discountVal,
      salePrice,
      originalPrice: product.price,
      saleStock: Number(item.saleStock || 20),
      soldCount: 0,
    });
  }

  const flashSale = await FlashSale.create({
    title,
    description: description || 'Limited-time Mega Festive Flash Sale',
    bannerImage: bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    startTime: start,
    endTime: end,
    isActive: true,
    products: validatedProducts,
    createdBy: req.user?._id,
  });

  return successResponse(res, flashSale, 'Flash sale campaign created successfully', 201);
});

/**
 * [Admin] Toggle campaign active status
 * PATCH /api/v1/admin/flash-sales/:id/toggle
 */
const toggleFlashSaleStatus = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) return errorResponse(res, 'Flash sale not found', 404);

  sale.isActive = !sale.isActive;
  await sale.save();

  return successResponse(res, sale, `Flash sale is now ${sale.isActive ? 'Active' : 'Inactive'}`);
});

/**
 * [Admin] Delete flash sale
 * DELETE /api/v1/admin/flash-sales/:id
 */
const deleteFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) return errorResponse(res, 'Flash sale not found', 404);

  await sale.deleteOne();
  return successResponse(res, null, 'Flash sale campaign deleted');
});

module.exports = {
  getActiveFlashSale,
  getAllFlashSales,
  createFlashSale,
  toggleFlashSaleStatus,
  deleteFlashSale,
};

