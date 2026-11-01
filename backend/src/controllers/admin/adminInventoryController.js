const Inventory = require('../../models/Inventory');
const InventoryTransaction = require('../../models/InventoryTransaction');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const { emitStockAlert } = require('../../sockets/socketManager');

/**
 * Get inventory items with status & stock filters
 * GET /api/v1/admin/inventory
 */
const getInventoryList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status, search } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status; // 'in_stock', 'low_stock', 'out_of_stock'
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.sku = regex;
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate('product', 'name price images category stock')
      .sort({ currentStock: 1 })
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(filter),
  ]);

  return successResponse(res, items, 'Inventory items retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Adjust Stock (Stock In, Stock Out, or Manual Adjustment)
 * POST /api/v1/admin/inventory/adjust
 */
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, type, quantity, reason } = req.body;
  const qty = parseInt(quantity, 10);

  if (!productId || !type || isNaN(qty) || qty <= 0) {
    return errorResponse(res, 'Valid Product ID, type (STOCK_IN, STOCK_OUT, ADJUSTMENT) and positive quantity are required', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  let inventory = await Inventory.findOne({ product: product._id });
  if (!inventory) {
    inventory = new Inventory({
      product: product._id,
      sku: product.sku,
      currentStock: product.stock,
    });
  }

  const prevStock = inventory.currentStock;
  let newStock = prevStock;

  if (type === 'STOCK_IN') {
    newStock = prevStock + qty;
  } else if (type === 'STOCK_OUT') {
    if (prevStock < qty) {
      return errorResponse(res, `Cannot deduct ${qty} units. Current stock is only ${prevStock}`, 400);
    }
    newStock = prevStock - qty;
  } else if (type === 'ADJUSTMENT') {
    newStock = qty; // direct reset to target quantity
  } else {
    return errorResponse(res, 'Invalid adjustment type', 400);
  }

  const changeQty = newStock - prevStock;

  // Atomic update
  inventory.currentStock = newStock;
  await inventory.save();

  // Sync Product model's stock
  product.stock = newStock;
  await product.save();

  // Create immutable Inventory Transaction Record
  const transaction = await InventoryTransaction.create({
    product: product._id,
    inventory: inventory._id,
    sku: product.sku,
    type,
    previousQuantity: prevStock,
    newQuantity: newStock,
    changeQuantity: changeQty,
    reason: reason || `Manual ${type} by Admin`,
    admin: req.admin?._id,
  });

  // Emit real-time stock alert if low or out of stock
  if (newStock <= (inventory.lowStockThreshold || 10)) {
    emitStockAlert(product, newStock, newStock === 0 ? 'out_of_stock' : 'low_stock');
  }

  recordAuditLog(req, 'STOCK_ADJUSTED', 'inventory', product._id, {
    sku: product.sku,
    type,
    prevStock,
    newStock,
    changeQty,
  });

  return successResponse(
    res,
    {
      inventory,
      transaction,
      currentStock: newStock,
    },
    'Stock updated successfully'
  );
});

/**
 * Get Stock Transaction History
 * GET /api/v1/admin/inventory/history
 */
const getInventoryHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { productId, sku } = req.query;
  const filter = {};

  if (productId) filter.product = productId;
  if (sku) filter.sku = new RegExp(sku.trim(), 'i');

  const [history, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .populate('product', 'name price images')
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryTransaction.countDocuments(filter),
  ]);

  return successResponse(res, history, 'Stock history retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

module.exports = {
  getInventoryList,
  adjustStock,
  getInventoryHistory,
};

