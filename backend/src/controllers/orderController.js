const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const SellerOrder = require('../models/SellerOrder');
const Seller = require('../models/Seller');
const Refund = require('../models/Refund');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { calculateServerOrderTotals } = require('../utils/calculateOrder');
const { generateOrderId } = require('../utils/generateOrderId');
const shippingService = require('../services/shippingService');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { emitOrderCreated, emitOrderStatusUpdated, emitStockAlert, emitToSeller } = require('../sockets/socketManager');

/**
 * Place a new order
 * POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddressId,
    shippingAddress: customAddress,
    paymentMethod,
    couponCode,
    items: directItems,
    idempotencyKey: bodyIdempotencyKey,
  } = req.body;

  // Idempotency Protection: Prevent duplicate orders from repeated requests
  const idempotencyKey = bodyIdempotencyKey || req.headers['idempotency-key'];
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ user: req.user._id, idempotencyKey });
    if (existingOrder) {
      return successResponse(res, { order: existingOrder }, 'Order retrieved successfully (idempotent)', 200);
    }
  }

  // 1. Resolve Shipping Address
  let targetAddress = null;
  if (shippingAddressId) {
    targetAddress = await Address.findOne({ _id: shippingAddressId, user: req.user._id });
    if (!targetAddress) {
      return errorResponse(res, 'Selected delivery address not found', 404);
    }
  } else if (customAddress) {
    targetAddress = customAddress;
  }

  const pinCode = targetAddress?.pinCode || targetAddress?.pincode;
  if (!targetAddress || !shippingService.isValidPinCode(pinCode)) {
    return errorResponse(res, 'Valid 6-digit Indian PIN code and address are required', 400);
  }

  // 2. Resolve Items: either from direct checkout or user's active Cart
  let orderItemsRaw = [];
  let cartDoc = null;

  if (directItems && Array.isArray(directItems) && directItems.length > 0) {
    orderItemsRaw = directItems;
  } else {
    cartDoc = await Cart.findOne({ user: req.user._id });
    if (!cartDoc || cartDoc.items.length === 0) {
      return errorResponse(res, 'Your cart is empty. Please add products to proceed.', 400);
    }
    orderItemsRaw = cartDoc.items;
  }

  // 3. Server-side validation of products and stock
  const productIds = orderItemsRaw.map((it) => (it.product?._id || it.product || it.id || it._id).toString());
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const validatedItems = [];
  for (const item of orderItemsRaw) {
    const pId = (item.product?._id || item.product || item.id || item._id).toString();
    const product = productMap.get(pId);

    if (!product || !product.isActive) {
      return errorResponse(res, `Product ${pId} is currently unavailable`, 400);
    }

    if (product.stock < item.quantity) {
      return errorResponse(res, `Only ${product.stock} units available for "${product.productName || product.name}"`, 400);
    }

    // Check independent variant stock if variantId is specified
    const variantId = item.selectedVariant?.variantId;
    if (variantId && product.variantItems?.length) {
      const v = product.variantItems.id(variantId);
      if (v && v.stock < item.quantity) {
        return errorResponse(res, `Only ${v.stock} units available for variant (${v.sku || v.attributes?.size || ''})`, 400);
      }
    }

    const itemPrice = (variantId && product.variantItems?.id(variantId)?.price) || product.price;

    validatedItems.push({
      product: product._id,
      name: product.productName || product.name,
      image: product.images?.[0] || '',
      price: itemPrice,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant || item.variant || {},
      seller: product.seller || null,
      sku: product.sku || '',
      gstPercentage: product.gstPercentage || 18,
    });
  }

  // 4. Resolve Coupon
  let couponDoc = null;
  const targetCouponCode = couponCode || cartDoc?.appliedCoupon?.code;
  if (targetCouponCode) {
    couponDoc = await Coupon.findOne({ code: targetCouponCode.toUpperCase().trim(), isActive: true });
    if (couponDoc && new Date() <= new Date(couponDoc.expiryDate)) {
      couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
      await couponDoc.save();
    } else {
      couponDoc = null;
    }
  }

  // 5. Calculate Server-side Totals & Pan India Shipping
  const pricing = calculateServerOrderTotals(validatedItems, couponDoc, pinCode);

  // Check COD restriction if chosen
  if (paymentMethod === 'COD') {
    const pinDetails = shippingService.getPinCodeDetails(pinCode);
    if (pinDetails && !pinDetails.isCodAvailable) {
      return errorResponse(res, 'Cash on Delivery is unavailable for this PIN code. Please select an online payment method.', 400);
    }
  }

  // 6. Generate Custom Order ID & Shipping Details
  const orderId = generateOrderId();
  const orderNumber = orderId;
  const estimatedDelivery = shippingService.checkPinCodeServiceability(pinCode);
  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const formattedAddress = {
    fullName: targetAddress.fullName || targetAddress.name || 'Customer',
    phone: targetAddress.phone || targetAddress.mobileNumber || '9876543210',
    mobileNumber: targetAddress.mobileNumber || targetAddress.phone || '9876543210',
    alternatePhone: targetAddress.alternatePhone || '',
    addressLine1: targetAddress.addressLine1 || targetAddress.streetAddress || targetAddress.street || 'Main Road',
    addressLine2: targetAddress.addressLine2 || '',
    landmark: targetAddress.landmark || '',
    city: targetAddress.city || 'Jaipur',
    state: targetAddress.state || 'Rajasthan',
    pinCode: pinCode,
    addressType: targetAddress.addressType || 'Home',
  };

  const order = await Order.create({
    orderId,
    orderNumber,
    user: req.user._id,
    items: validatedItems,
    deliveryAddress: formattedAddress,
    shippingAddress: formattedAddress,
    pricing,
    subtotal: pricing.subtotal,
    discount: pricing.couponDiscount || pricing.discount || 0,
    deliveryCharges: pricing.deliveryFee || 0,
    totalAmount: pricing.grandTotal,
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    orderStatus: 'Confirmed',
    shippingDetails: {
      courierName: 'Delhivery Pan-India Express',
      estimatedDeliveryDate: estimatedDelivery.estimatedDeliveryDate,
    },
    trackingTimeline: [
      { status: 'Order Placed', time: 'Just now', completed: true },
      { status: 'Order Confirmed', time: 'Just now', completed: true },
      { status: 'Shipped from Hub', time: 'Pending', completed: false },
      { status: 'Out for Delivery', time: 'Pending', completed: false },
      { status: 'Delivered', time: 'Pending', completed: false },
    ],
    deliveryOtp,
    idempotencyKey,
  });

  // 7. Deduct Product Stock Atomically (both total and specific variant)
  for (const item of validatedItems) {
    if (item.selectedVariant?.variantId) {
      await Product.updateOne(
        { _id: item.product, 'variantItems._id': item.selectedVariant.variantId },
        {
          $inc: {
            'variantItems.$.stock': -item.quantity,
            stock: -item.quantity,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  // 8. If cart was used, clear it
  if (cartDoc) {
    cartDoc.items = [];
    cartDoc.appliedCoupon = undefined;
    await cartDoc.save();
  }

  // 9. Split & Create SellerOrder Sub-Orders for Multi-Vendor Order Fulfillment
  let defaultSeller = null;
  const itemsBySeller = new Map();

  for (const it of validatedItems) {
    let sId = it.seller ? it.seller.toString() : null;
    if (!sId) {
      if (!defaultSeller) {
        defaultSeller = await Seller.findOne({ status: 'approved' }) || await Seller.findOne();
      }
      sId = defaultSeller ? defaultSeller._id.toString() : null;
    }
    if (sId) {
      if (!itemsBySeller.has(sId)) {
        itemsBySeller.set(sId, []);
      }
      itemsBySeller.get(sId).push(it);
    }
  }

  let subOrderIdx = 1;
  for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
    const subtotal = sellerItems.reduce((acc, x) => acc + x.price * x.quantity, 0);
    const commissionRate = 10;
    const commissionAmount = Math.round((subtotal * commissionRate) / 100);
    const netEarnings = subtotal - commissionAmount;
    const subOrderNumber = `${order.orderId}-S${subOrderIdx++}`;

    const sOrder = await SellerOrder.create({
      subOrderNumber,
      order: order._id,
      orderNumber: order.orderId,
      seller: sellerId,
      user: req.user._id,
      customerName: formattedAddress.fullName,
      customerPhone: formattedAddress.phone,
      shippingAddress: {
        fullName: formattedAddress.fullName,
        addressLine1: formattedAddress.addressLine1,
        addressLine2: formattedAddress.addressLine2,
        city: formattedAddress.city,
        state: formattedAddress.state,
        pinCode: formattedAddress.pinCode,
        mobileNumber: formattedAddress.mobileNumber,
      },
      items: sellerItems.map((si) => ({
        product: si.product,
        name: si.name,
        sku: si.sku || '',
        price: si.price,
        quantity: si.quantity,
        selectedVariant: si.selectedVariant,
        image: si.image,
        gstPercentage: si.gstPercentage || 18,
      })),
      itemCount: sellerItems.reduce((acc, x) => acc + x.quantity, 0),
      subtotal,
      commissionRate,
      commissionAmount,
      netEarnings,
      status: 'new',
      paymentMethod: paymentMethod === 'COD' ? 'COD' : 'ONLINE',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    });

    try {
      emitToSeller(sellerId, 'seller:new_order', {
        subOrderNumber: sOrder.subOrderNumber,
        orderNumber: sOrder.orderNumber,
        itemCount: sOrder.itemCount,
        subtotal: sOrder.subtotal,
        netEarnings: sOrder.netEarnings,
        createdAt: sOrder.createdAt,
      });
    } catch (e) {}
  }

  // 10. Prepare Razorpay order if Razorpay is chosen
  let razorpayOrder = null;
  if (paymentMethod === 'Razorpay') {
    try {
      razorpayOrder = await paymentService.createRazorpayOrder({
        amount: pricing.grandTotal,
        receipt: order.orderId,
        notes: {
          orderId: order.orderId,
          userId: req.user._id.toString(),
        },
      });
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    } catch (razorpayErr) {
      console.error('Razorpay initialization error:', razorpayErr.message);
    }
  }

  // 11. Trigger Async Notifications, Email and Real-Time Admin Socket
  notificationService.sendOrderNotification(req.user._id, order, 'created').catch(() => {});
  emailService.sendOrderConfirmationEmail(req.user, order).catch(() => {});
  emitOrderCreated(order);

  return successResponse(
    res,
    {
      order,
      razorpayOrder,
    },
    'Order placed successfully!',
    201
  );
});

/**
 * Get current user's orders
 * GET /api/orders/my-orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return successResponse(res, orders, 'Orders retrieved successfully', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Get single order details
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  const isMatch = isObjectId
    ? { $or: [{ _id: id }, { orderId: id }, { orderNumber: id }] }
    : { $or: [{ orderId: id }, { orderNumber: id }] };

  const order = await Order.findOne(isMatch).populate('items.product', 'images brand slug');

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Ensure user owns order or is admin
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied', 403);
  }

  const tracking = shippingService.getSimulatedTracking(order);

  // Fetch refund details if refunded
  const refund = await Refund.findOne({ order: order._id });

  return successResponse(res, { order, tracking, refund }, 'Order details retrieved');
});

/**
 * Track order delivery
 * GET /api/orders/:id/track
 */
const trackOrder = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  const isMatch = isObjectId
    ? { $or: [{ _id: id }, { orderId: id }, { orderNumber: id }] }
    : { $or: [{ orderId: id }, { orderNumber: id }] };

  const order = await Order.findOne(isMatch);
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  const tracking = shippingService.getSimulatedTracking(order);
  return successResponse(res, tracking, 'Order tracking details retrieved');
});

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const isMatch = req.params.id.startsWith?.('BBIN-')
    ? { orderId: req.params.id, user: req.user._id }
    : { _id: req.params.id, user: req.user._id };

  const order = await Order.findOne(isMatch);

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  if (['Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
    return errorResponse(res, `Order cannot be cancelled in status: ${order.orderStatus}`, 400);
  }

  order.orderStatus = 'Cancelled';
  order.cancellationReason = reason || 'Cancelled by customer';
  order.cancelledAt = new Date();

  // Restore product stock atomically (both total and specific variant)
  for (const item of order.items) {
    if (item.selectedVariant?.variantId) {
      await Product.updateOne(
        { _id: item.product, 'variantItems._id': item.selectedVariant.variantId },
        {
          $inc: {
            'variantItems.$.stock': item.quantity,
            stock: item.quantity,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  // Cancel any associated Seller Sub-Orders
  await SellerOrder.updateMany(
    { order: order._id },
    {
      $set: {
        status: 'cancelled',
        cancelledReason: order.cancellationReason,
        cancelledAt: new Date(),
        cancellationSource: 'customer',
      },
    }
  );

  // Handle Refund Process for Paid Orders
  let refundRecord = null;
  const refundAmount = order.totalAmount || order.pricing?.grandTotal || 0;

  if (order.paymentStatus === 'Paid' && refundAmount > 0) {
    // Prevent duplicate refunds
    const existingRefund = await Refund.findOne({ order: order._id });
    if (!existingRefund) {
      let gatewayRefund = null;
      if (order.razorpayPaymentId) {
        try {
          gatewayRefund = await paymentService.processRefund(
            order.razorpayPaymentId,
            refundAmount,
            { orderId: order.orderId, reason: order.cancellationReason }
          );
        } catch (refErr) {
          console.error('[Refund Gateway Error]', refErr.message);
        }
      }

      refundRecord = await Refund.create({
        order: order._id,
        amount: refundAmount,
        currency: 'INR',
        method: order.paymentMethod === 'Razorpay' ? 'Razorpay' : 'Original',
        status: gatewayRefund ? 'Processed' : 'Pending',
        gatewayRefundId: gatewayRefund?.id || null,
        reason: order.cancellationReason,
        processedAt: gatewayRefund ? new Date() : null,
        gatewayResponse: gatewayRefund || null,
      });

      order.paymentStatus = 'Refunded';
      order.refundStatus = gatewayRefund ? 'Processed' : 'Pending';
      order.refundAmount = refundAmount;
      order.refundTransactionRef = gatewayRefund?.id || null;
    }
  } else if (order.paymentMethod === 'COD') {
    order.paymentStatus = 'Cancelled';
    order.refundStatus = 'None';
  }

  await order.save();

  notificationService.sendOrderNotification(req.user._id, order, 'cancelled').catch(() => {});
  emitOrderStatusUpdated(order);

  return successResponse(
    res,
    {
      order,
      refund: refundRecord,
    },
    'Order cancelled successfully' + (refundRecord ? '. Refund of ₹' + refundAmount + ' has been initiated.' : '.')
  );
});

/**
 * [Admin] Get all orders
 * GET /api/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { status, search } = req.query;
  const filter = {};

  if (status) filter.orderStatus = status;
  if (search) {
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return successResponse(res, orders, 'All orders retrieved', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * [Admin] Update order status and courier details
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, courierName, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'Paid';
    }
  }

  if (courierName) order.shippingDetails.courierName = courierName;
  if (trackingNumber) order.shippingDetails.trackingNumber = trackingNumber;

  await order.save();

  notificationService.sendOrderNotification(order.user, order, orderStatus.toLowerCase()).catch(() => {});
  emitOrderStatusUpdated(order);

  return successResponse(res, order, 'Order status updated successfully');
});

/**
 * Generate GST Tax Invoice data
 * GET /api/orders/:id/invoice
 */
const getOrderInvoice = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const isMongoId = targetId.match(/^[0-9a-fA-F]{24}$/);
  const filter = isMongoId
    ? { _id: targetId }
    : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };

  const order = await Order.findOne(filter)
    .populate('user', 'fullName name email mobileNumber phone')
    .populate('items.product', 'productName name sku hsnCode gstPercentage brand');

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Authorization: must be order owner or admin
  if (
    req.user &&
    order.user?._id?.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return errorResponse(res, 'Access denied', 403);
  }

  const invoiceNumber = `INV-${order.orderId || order.orderNumber}`;
  const invoiceDate = order.deliveredAt || order.createdAt;

  // Indian GST Tax calculation
  const subtotal = order.summary?.subtotal || order.subtotal || 0;
  const discount = order.summary?.discount || order.discount || 0;
  const deliveryFee = order.summary?.deliveryFee || 0;
  const taxableValue = Math.max(0, subtotal - discount);

  // Standard 18% GST (or 9% CGST + 9% SGST for intra-state)
  const isInterState = order.deliveryAddress?.state?.toLowerCase() !== 'rajasthan';
  const gstRate = 18;
  const gstAmount = Math.round((taxableValue * gstRate) / (100 + gstRate));
  const baseValue = taxableValue - gstAmount;
  const cgst = isInterState ? 0 : Math.round(gstAmount / 2);
  const sgst = isInterState ? 0 : Math.round(gstAmount / 2);
  const igst = isInterState ? gstAmount : 0;

  const invoiceData = {
    invoiceNumber,
    invoiceDate,
    orderId: order.orderId || order.orderNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    seller: {
      name: 'Bharat Bazaar Artisans & Retail LLP',
      gstin: '08AABCB1234F1Z9',
      address: 'Plot 45, Craft Zone, Sitapura Industrial Area, Jaipur, Rajasthan - 302022',
      email: 'tax-invoices@bharatbazaar.in',
      state: 'Rajasthan',
      stateCode: '08',
    },
    customer: {
      fullName: order.deliveryAddress?.fullName || order.user?.fullName || 'Valued Customer',
      mobileNumber: order.deliveryAddress?.mobileNumber || order.user?.mobileNumber || '',
      email: order.user?.email || '',
      billingAddress: `${order.deliveryAddress?.addressLine1 || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pinCode || ''}`,
      shippingAddress: `${order.deliveryAddress?.addressLine1 || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pinCode || ''}`,
      placeOfSupply: order.deliveryAddress?.state || 'Rajasthan',
    },
    items: order.items.map((it, idx) => ({
      serialNo: idx + 1,
      description: it.name,
      hsnCode: it.product?.hsnCode || '5208',
      variant: it.selectedVariant?.size ? `Size: ${it.selectedVariant.size}` : 'Standard',
      quantity: it.quantity,
      unitPrice: it.price,
      taxableAmount: it.price * it.quantity,
      gstRate: `${it.product?.gstPercentage || 18}%`,
      total: it.price * it.quantity,
    })),
    summary: {
      subtotal,
      discount,
      taxableValue: baseValue,
      cgst,
      sgst,
      igst,
      totalTax: gstAmount,
      deliveryFee,
      grandTotal: order.summary?.totalAmount || taxableValue + deliveryFee,
    },
  };

  return successResponse(res, invoiceData, 'Tax invoice generated successfully');
});

/**
 * Generate Printable HTML Tax Invoice
 * GET /api/orders/:id/invoice/html
 */
const getOrderInvoiceHtml = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const isMongoId = targetId.match(/^[0-9a-fA-F]{24}$/);
  const filter = isMongoId
    ? { _id: targetId }
    : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };

  const order = await Order.findOne(filter).populate('items.product');
  if (!order) {
    return res.status(404).send('<h1>Order not found</h1>');
  }

  const subtotal = order.summary?.subtotal || 0;
  const discount = order.summary?.discount || 0;
  const deliveryFee = order.summary?.deliveryFee || 0;
  const total = order.summary?.totalAmount || subtotal - discount + deliveryFee;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GST Tax Invoice - ${order.orderId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; font-size: 13px; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 32px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #ea580c; margin: 0; }
    .tax-badge { background: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #334155; }
    .two-col { display: flex; justify-content: space-between; margin-top: 24px; }
    .col-box { width: 48%; }
    .box-title { font-size: 12px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 6px; }
    .info-line { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    th { background: #f8fafc; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .tot-row { display: flex; justify-content: flex-end; margin-top: 24px; }
    .tot-table { width: 300px; border-collapse: collapse; }
    .tot-table td { padding: 6px 12px; }
    .grand-tot { font-weight: 900; font-size: 16px; color: #0f172a; border-top: 2px solid #cbd5e1; }
    .print-btn { background: #ea580c; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; margin-bottom: 16px; }
    @media print { .print-btn { display: none; } body { padding: 0; } .invoice-card { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 800px; margin: 0 auto;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header-row">
      <div>
        <h1 class="brand-title">BHARAT BAZAAR</h1>
        <p style="margin: 4px 0 0; color: #64748b;">Authentic Indian Crafts & Multi-Vendor Marketplace</p>
      </div>
      <div style="text-align: right;">
        <span class="tax-badge">Tax Invoice</span>
        <p style="margin: 8px 0 2px; font-weight: 800;">#INV-${order.orderId}</p>
        <p style="margin: 0; color: #64748b;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
      </div>
    </div>
    <div class="two-col">
      <div class="col-box">
        <div class="box-title">Sold By (Seller Details)</div>
        <div class="info-line"><strong>Bharat Bazaar Artisans LLP</strong></div>
        <div class="info-line">GSTIN: <strong>08AABCB1234F1Z9</strong></div>
        <div class="info-line">Sitapura Industrial Area, Jaipur - 302022</div>
        <div class="info-line">PAN: AABCB1234F | State: Rajasthan (08)</div>
      </div>
      <div class="col-box">
        <div class="box-title">Billing & Shipping Address</div>
        <div class="info-line"><strong>${order.deliveryAddress?.fullName || 'Customer'}</strong></div>
        <div class="info-line">${order.deliveryAddress?.addressLine1 || ''}</div>
        <div class="info-line">${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pinCode || ''}</div>
        <div class="info-line">Mobile: +91 ${order.deliveryAddress?.mobileNumber || ''}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Taxable Value</th>
          <th>GST</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${it.name}</strong><br><small style="color: #64748b;">HSN: 5208 | Variant: ${it.selectedVariant?.size || 'Standard'}</small></td>
          <td>${it.quantity}</td>
          <td>₹${it.price.toLocaleString('en-IN')}</td>
          <td>₹${(it.price * it.quantity).toLocaleString('en-IN')}</td>
          <td>18%</td>
          <td><strong>₹${(it.price * it.quantity).toLocaleString('en-IN')}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="tot-row">
      <table class="tot-table">
        <tr><td>Items Subtotal:</td><td style="text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td></tr>
        ${discount > 0 ? `<tr><td>Coupon Discount:</td><td style="text-align: right; color: #16a34a;">-₹${discount.toLocaleString('en-IN')}</td></tr>` : ''}
        <tr><td>Delivery Fee:</td><td style="text-align: right;">${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</td></tr>
        <tr class="grand-tot"><td>Grand Total:</td><td style="text-align: right;">₹${total.toLocaleString('en-IN')}</td></tr>
      </table>
    </div>
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center;">
      This is a system-generated tax invoice under the Indian Goods and Services Tax Act, 2017. No signature required.
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderInvoice,
  getOrderInvoiceHtml,
};

