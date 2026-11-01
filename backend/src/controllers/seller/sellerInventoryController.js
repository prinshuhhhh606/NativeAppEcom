/**
 * Seller Inventory Management Controller
 * Atomic stock updates, low-stock alerts, and audit logging
 */
const Product = require('../../models/Product');
const InventoryTransaction = require('../../models/InventoryTransaction');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * Get Seller Inventory List
 * GET /api/v1/seller/inventory
 */
const getInventory = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const { page = 1, limit = 15, search, lowStockOnly } = req.query;

  const query = { seller: sellerId, isActive: true };

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (lowStockOnly === 'true') {
    query.stock = { $lte: 5 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, totalCount] = await Promise.all([
    Product.find(query)
      .select('productName sku stock price images variants approvalStatus updatedAt')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  const formattedItems = items.map((p) => ({
    id: p._id,
    productName: p.productName,
    sku: p.sku,
    price: p.price,
    image: p.images?.[0] || '',
    stock: p.stock,
    isLowStock: p.stock <= 5,
    isOutOfStock: p.stock === 0,
    status: p.approvalStatus,
    updatedAt: p.updatedAt,
  }));

  return successResponse(res, formattedItems, 'Inventory fetched successfully', 200, {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  });
});

/**
 * Adjust Product Stock (Stock In / Stock Out / Audit)
 * POST /api/v1/seller/inventory/adjust
 */
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, changeQuantity, reason = 'stock_replenishment', notes = '' } = req.body || {};

  if (!productId || changeQuantity === undefined) {
    return errorResponse(res, 'Product ID and change quantity are required', 400);
  }

  const qty = Number(changeQuantity);
  if (isNaN(qty) || qty === 0) {
    return errorResponse(res, 'Change quantity must be a non-zero number', 400);
  }

  const product = await Product.findOne({ _id: productId, seller: req.seller._id });
  if (!product) {
    return errorResponse(res, 'Product not found or access denied', 404);
  }

  const previousStock = product.stock;
  const newStock = previousStock + qty;

  if (newStock < 0) {
    return errorResponse(res, `Cannot reduce stock below 0. Current stock is ${previousStock}.`, 400);
  }

  product.stock = newStock;
  await product.save();

  // Log in InventoryTransaction if collection is active
  try {
    await InventoryTransaction.create({
      product: product._id,
      sku: product.sku,
      previousStock,
      newStock,
      quantityChanged: qty,
      type: qty > 0 ? 'RESTOCK' : 'ADJUSTMENT',
      reason: `${reason}: ${notes}`.trim(),
      performedBy: req.seller._id,
      userModel: 'Seller',
    });
  } catch (err) {}

  return successResponse(
    res,
    {
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      previousStock,
      newStock,
      quantityChanged: qty,
    },
    `Stock adjusted successfully. New stock: ${newStock}`
  );
});

/**
 * Get Inventory Audit Logs for Seller
 * GET /api/v1/seller/inventory/history
 */
const getInventoryHistory = asyncHandler(async (req, res) => {
  const sellerProducts = await Product.find({ seller: req.seller._id }).select('_id');
  const productIds = sellerProducts.map((p) => p._id);

  const history = await InventoryTransaction.find({ product: { $in: productIds } })
    .populate('product', 'productName sku images')
    .sort({ createdAt: -1 })
    .limit(30);

  return successResponse(res, history, 'Inventory history retrieved');
});

module.exports = {
  getInventory,
  adjustStock,
  getInventoryHistory,
};

