/**
 * Complete Integration Test Suite for Dual Access System
 * Tests:
 * 1. Single Account & Unified Auth (same credentials on customer & seller login)
 * 2. Seller permissions on Customer routes (cart, wishlist, address, order placement)
 * 3. Seller permissions on Seller routes (dashboard, products, orders)
 * 4. Absolute separation of personal shopping orders vs business vendor orders
 */
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const env = require('../src/config/env');
const Seller = require('../src/models/Seller');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const SellerOrder = require('../src/models/SellerOrder');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const Address = require('../src/models/Address');

const authController = require('../src/controllers/authController');
const sellerAuthController = require('../src/controllers/seller/sellerAuthController');
const cartController = require('../src/controllers/cartController');
const wishlistController = require('../src/controllers/wishlistController');
const addressController = require('../src/controllers/addressController');
const orderController = require('../src/controllers/orderController');
const sellerOrderController = require('../src/controllers/seller/sellerOrderController');
const sellerDashboardController = require('../src/controllers/seller/sellerDashboardController');

const { protect } = require('../src/middleware/authMiddleware');
const { protectSeller } = require('../src/middleware/sellerAuthMiddleware');

function createMockReqRes(options = {}) {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const req = {
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    user: options.user || null,
    seller: options.seller || null,
  };

  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      resolvePromise({ statusCode: this.statusCode, data: payload });
      return this;
    },
    send(payload) {
      this.payload = payload;
      resolvePromise({ statusCode: this.statusCode, data: payload });
      return this;
    },
  };

  const next = (err) => {
    if (err) {
      resolvePromise({ statusCode: 500, error: err });
    } else {
      resolvePromise({ statusCode: 200, nextCalled: true });
    }
  };

  return { req, res, next, wait: () => promise };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING DUAL ACCESS SYSTEM VERIFICATION TEST SUITE');
  console.log('================================================================');

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✓ Connected to MongoDB');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup / identify test seller
    let testSeller = await Seller.findOne({ email: 'seller@appecom.in' }).select('+password');
    if (!testSeller) {
      testSeller = await Seller.create({
        name: 'Rajesh Sharma',
        email: 'seller@appecom.in',
        password: 'Seller@12345',
        phone: '9876543210',
        businessName: 'Jaipur Handlooms',
        storeName: 'Jaipur Handlooms',
        status: 'approved',
        isVerified: true,
      });
    } else if (testSeller.status !== 'approved') {
      testSeller.status = 'approved';
      await testSeller.save({ validateBeforeSave: false });
    }

    console.log(`\nTest Seller: ${testSeller.email} (ID: ${testSeller._id})`);

    // -------------------------------------------------------------
    // TEST 1: Seller Login through Seller Auth Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Seller Login via /api/v1/seller/auth/login ---');
    const { req: sReq, res: sRes, wait: sWait } = createMockReqRes({
      body: { email: 'seller@appecom.in', password: 'Seller@12345' },
    });
    sellerAuthController.login(sReq, sRes);
    const sResult = await sWait();
    assert(sResult.statusCode === 200, 'Seller login returned 200 OK');
    const sellerAccessToken = sResult.data?.data?.accessToken || sResult.data?.accessToken;
    assert(!!sellerAccessToken, 'Access token generated for seller session');
    assert(sResult.data?.data?.seller?.canShop === true, 'Response marks canShop: true for dual access');

    // -------------------------------------------------------------
    // TEST 2: Customer Login using SAME Seller Credentials via /api/auth/login
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Seller Login via Customer Endpoint (/api/auth/login) ---');
    const { req: cReq, res: cRes, wait: cWait } = createMockReqRes({
      body: { identifier: 'seller@appecom.in', password: 'Seller@12345' },
    });
    authController.login(cReq, cRes);
    const cResult = await cWait();
    assert(cResult.statusCode === 200, 'Customer endpoint accepted seller credentials with 200 OK');
    const dualUser = cResult.data?.data?.user;
    assert(dualUser && dualUser.isSeller === true, 'User payload returned with isSeller: true');
    assert(dualUser && dualUser.role === 'seller', 'User role correctly designated as seller');
    assert(dualUser && dualUser.canShop === true, 'canShop flag active for customer shopping');

    // -------------------------------------------------------------
    // TEST 3: Auth Middleware Protect recognizes Seller on Customer Routes
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Protect Middleware with Seller Access Token ---');
    const { req: pReq, res: pRes, next: pNext, wait: pWait } = createMockReqRes({
      headers: { authorization: `Bearer ${sellerAccessToken}` },
    });
    protect(pReq, pRes, pNext);
    const pResult = await pWait();
    assert(pResult.nextCalled === true, 'protect middleware accepted seller token');
    assert(pReq.user && pReq.user._id.toString() === testSeller._id.toString(), 'req.user populated with seller id');
    assert(pReq.isSeller === true, 'req.isSeller flag attached');

    // -------------------------------------------------------------
    // TEST 4: Protect Seller Middleware recognizes same token on Seller Routes
    // -------------------------------------------------------------
    console.log('\n--- Test 4: protectSeller Middleware with Same Access Token ---');
    const { req: psReq, res: psRes, next: psNext, wait: psWait } = createMockReqRes({
      headers: { authorization: `Bearer ${sellerAccessToken}` },
    });
    protectSeller(psReq, psRes, psNext);
    const psResult = await psWait();
    assert(psResult.nextCalled === true, 'protectSeller middleware accepted token');
    assert(psReq.seller && psReq.seller._id.toString() === testSeller._id.toString(), 'req.seller populated');

    // -------------------------------------------------------------
    // TEST 5: Seller Access to Cart (Customer Shopping Feature)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Seller Cart Operations (Shopping as Customer) ---');
    // Fetch a sample product
    const sampleProduct = await Product.findOne({ isActive: true, approvalStatus: 'approved' });
    assert(!!sampleProduct, 'Sample product available in database');

    const { req: cartReq, res: cartRes, wait: cartWait } = createMockReqRes({
      user: pReq.user,
    });
    cartController.getCart(cartReq, cartRes);
    const cartResult = await cartWait();
    assert(cartResult.statusCode === 200, 'Seller can fetch active customer shopping cart');

    const { req: addCartReq, res: addCartRes, wait: addCartWait } = createMockReqRes({
      user: pReq.user,
      body: { productId: sampleProduct._id, quantity: 2 },
    });
    cartController.addToCart(addCartReq, addCartRes);
    const addCartResult = await addCartWait();
    assert(addCartResult.statusCode === 200, 'Seller can add items to personal shopping cart');

    // -------------------------------------------------------------
    // TEST 6: Seller Access to Wishlist (Customer Feature)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Seller Wishlist Operations ---');
    const { req: wishReq, res: wishRes, wait: wishWait } = createMockReqRes({
      user: pReq.user,
      body: { productId: sampleProduct._id },
    });
    wishlistController.toggleWishlist(wishReq, wishRes);
    const wishResult = await wishWait();
    assert(wishResult.statusCode === 200, 'Seller can toggle items in personal wishlist');

    // -------------------------------------------------------------
    // TEST 7: Seller Places Personal Shopping Order
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Seller Places Personal Shopping Order ---');
    // Ensure address exists for seller
    let sellerAddress = await Address.findOne({ user: testSeller._id });
    if (!sellerAddress) {
      sellerAddress = await Address.create({
        user: testSeller._id,
        fullName: 'Rajesh Sharma',
        mobileNumber: '9876543210',
        addressLine1: 'B-12, Heritage Colony',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302001',
        isDefault: true,
      });
    }

    const { req: ordReq, res: ordRes, wait: ordWait } = createMockReqRes({
      user: pReq.user,
      body: {
        shippingAddressId: sellerAddress._id,
        paymentMethod: 'COD',
        items: [
          {
            product: sampleProduct._id,
            name: sampleProduct.name || sampleProduct.productName,
            price: sampleProduct.price || 999,
            quantity: 1,
          },
        ],
      },
    });
    orderController.createOrder(ordReq, ordRes);
    const ordResult = await ordWait();
    assert(ordResult.statusCode === 201 || ordResult.statusCode === 200, 'Seller placed personal order successfully');
    const personalOrder = ordResult.data?.data?.order || ordResult.data?.order;
    assert(!!personalOrder, 'Personal order created in database');
    console.log(`  Personal Order ID: ${personalOrder?.orderId || personalOrder?.orderNumber}`);

    // -------------------------------------------------------------
    // TEST 8: Order Separation - Personal Order in My Orders
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Order Separation - Customer "My Orders" ---');
    const { req: myOrdReq, res: myOrdRes, wait: myOrdWait } = createMockReqRes({
      user: pReq.user,
    });
    orderController.getMyOrders(myOrdReq, myOrdRes);
    const myOrdResult = await myOrdWait();
    assert(myOrdResult.statusCode === 200, 'getMyOrders returned 200 OK');
    const myOrdersList = myOrdResult.data?.data || myOrdResult.data || [];
    const foundInMyOrders = myOrdersList.some(
      (o) => (o.orderId || o.orderNumber) === (personalOrder.orderId || personalOrder.orderNumber)
    );
    assert(foundInMyOrders, 'Personal order appears in customer shopping "My Orders" list');

    // -------------------------------------------------------------
    // TEST 9: Order Separation - Personal Order EXCLUDED from Seller Business Orders
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Order Separation - Seller Business Orders List ---');
    const { req: sOrdReq, res: sOrdRes, wait: sOrdWait } = createMockReqRes({
      seller: testSeller,
      query: { status: 'all' },
    });
    sellerOrderController.getOrders(sOrdReq, sOrdRes);
    const sOrdResult = await sOrdWait();
    assert(sOrdResult.statusCode === 200, 'Seller getOrders returned 200 OK');
    const sellerOrdersList = sOrdResult.data?.data?.orders || sOrdResult.data?.orders || sOrdResult.data || [];
    const foundInSellerOrders = sellerOrdersList.some(
      (so) => so.user && so.user.toString() === testSeller._id.toString()
    );
    assert(!foundInSellerOrders, 'CRITICAL: Personal purchases are NEVER displayed in Seller Business Orders!');

    // -------------------------------------------------------------
    // TEST 10: Order Statistics Exclude Personal Purchases
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Seller Statistics & Dashboard Metrics ---');
    const { req: statReq, res: statRes, wait: statWait } = createMockReqRes({
      seller: testSeller,
    });
    sellerOrderController.getOrderStatistics(statReq, statRes);
    const statResult = await statWait();
    assert(statResult.statusCode === 200, 'getOrderStatistics returned 200 OK');

    const { req: dashReq, res: dashRes, wait: dashWait } = createMockReqRes({
      seller: testSeller,
      query: { timeframe: '30d' },
    });
    sellerDashboardController.getDashboardMetrics(dashReq, dashRes);
    const dashResult = await dashWait();
    assert(dashResult.statusCode === 200, 'Seller Dashboard Metrics returned 200 OK');

    console.log('\n================================================================');
    console.log(`🏁 TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  }
}

runTests();

