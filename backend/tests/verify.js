/**
 * Smoke verification script for Pan India E-Commerce Backend & Admin Panel
 */
const assert = require('assert');

console.log('Testing modules loading...');

try {
  // Test configs & utils
  const env = require('../src/config/env');
  console.log('✓ Configs loaded');

  const { successResponse, errorResponse } = require('../src/utils/apiResponse');
  const { generateAccessToken, verifyAccessToken } = require('../src/utils/generateToken');
  const { generateOrderId } = require('../src/utils/generateOrderId');
  const { calculateServerOrderTotals } = require('../src/utils/calculateOrder');
  console.log('✓ Utils loaded');

  // Verify JWT
  const testId = '654321654321654321654321';
  const token = generateAccessToken(testId);
  const decoded = verifyAccessToken(token);
  assert.strictEqual(decoded.id, testId, 'JWT verification failed');
  console.log('✓ JWT Token generation & verification working');

  // Verify Order ID pattern
  const oId = generateOrderId();
  assert(oId.startsWith('BBIN-'), 'Order ID format invalid');
  console.log(`✓ Order ID generation working: ${oId}`);

  // Test Shipping Service
  const shippingService = require('../src/services/shippingService');
  assert.strictEqual(shippingService.isValidPinCode('110001'), true);
  assert.strictEqual(shippingService.isValidPinCode('560103'), true);
  assert.strictEqual(shippingService.isValidPinCode('010001'), false);
  assert.strictEqual(shippingService.isValidPinCode('12345'), false);

  const delhiLookup = shippingService.getPinCodeDetails('110001');
  assert(delhiLookup.city.includes('Delhi'));
  console.log(`✓ PIN code lookup working: 110001 -> ${delhiLookup.city}, ${delhiLookup.state}`);

  const blrLookup = shippingService.checkPinCodeServiceability('560103', 600);
  assert.strictEqual(blrLookup.serviceable, true);
  assert.strictEqual(blrLookup.isFreeDelivery, true);
  console.log(`✓ Pan India Serviceability check working: 560103 -> Free delivery: ${blrLookup.isFreeDelivery}`);

  // Test Customer Models
  require('../src/models/User');
  require('../src/models/Product');
  require('../src/models/Category');
  require('../src/models/Cart');
  require('../src/models/Wishlist');
  require('../src/models/Address');
  require('../src/models/Order');
  require('../src/models/Payment');
  require('../src/models/Coupon');
  require('../src/models/Review');
  require('../src/models/Notification');
  require('../src/models/ReturnRequest');

  // Test Admin Models
  require('../src/models/Admin');
  require('../src/models/Role');
  require('../src/models/Permission');
  require('../src/models/Inventory');
  require('../src/models/InventoryTransaction');
  require('../src/models/Shipment');
  require('../src/models/Refund');
  require('../src/models/StoreSetting');
  require('../src/models/AuditLog');
  console.log('✓ All 21 Mongoose Models (Customer + Admin) loaded without error');

  // Test Middlewares loading
  require('../src/middleware/authMiddleware');
  require('../src/middleware/adminAuthMiddleware');
  require('../src/middleware/errorMiddleware');
  require('../src/middleware/uploadMiddleware');
  require('../src/middleware/validationMiddleware');
  require('../src/middleware/rateLimitMiddleware');
  console.log('✓ All Middlewares loaded without error');

  // Test Services & Sockets
  require('../src/services/otpService');
  require('../src/services/emailService');
  require('../src/services/paymentService');
  require('../src/services/cloudinaryService');
  require('../src/services/notificationService');
  require('../src/sockets/socketManager');
  console.log('✓ All Services & Sockets loaded without error');

  // Test Customer Controllers loading
  require('../src/controllers/authController');
  require('../src/controllers/userController');
  require('../src/controllers/productController');
  require('../src/controllers/categoryController');
  require('../src/controllers/cartController');
  require('../src/controllers/wishlistController');
  require('../src/controllers/addressController');
  require('../src/controllers/orderController');
  require('../src/controllers/paymentController');
  require('../src/controllers/couponController');
  require('../src/controllers/reviewController');
  require('../src/controllers/notificationController');
  require('../src/controllers/deliveryController');
  require('../src/controllers/returnController');

  // Test Admin Controllers loading
  require('../src/controllers/admin/adminAuthController');
  require('../src/controllers/admin/adminDashboardController');
  require('../src/controllers/admin/adminProductController');
  require('../src/controllers/admin/adminCategoryController');
  require('../src/controllers/admin/adminInventoryController');
  require('../src/controllers/admin/adminOrderController');
  require('../src/controllers/admin/adminCustomerController');
  require('../src/controllers/admin/adminCouponController');
  require('../src/controllers/admin/adminPaymentController');
  require('../src/controllers/admin/adminShippingController');
  require('../src/controllers/admin/adminReturnController');
  require('../src/controllers/admin/adminReviewController');
  require('../src/controllers/admin/adminReportController');
  require('../src/controllers/admin/adminSettingController');
  console.log('✓ All 28 Controllers (Customer + Admin) loaded without error');

  // Test Routes & Express App
  const { app, httpServer } = require('../src/server');
  assert(typeof app === 'function', 'Express app failed to initialize');
  assert(httpServer !== null, 'HTTP server failed to initialize');
  console.log('✓ Express Application, Socket.IO Server and All Route Groups initialized smoothly');

  console.log('\n======================================================');
  console.log('🎉 ALL BACKEND CODEBASE VERIFICATIONS PASSED (100%)');
  console.log('======================================================\n');
} catch (err) {
  console.error('❌ Verification failed:', err);
  process.exit(1);
}
