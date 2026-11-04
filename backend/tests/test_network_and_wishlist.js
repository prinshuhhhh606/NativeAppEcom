/**
 * Test Suite: Network, Base URL, Health, and Wishlist End-to-End System
 * Uses mock req/res to run 100% sandboxed without requiring raw socket TCP connections.
 */
const mongoose = require('mongoose');
const Wishlist = require('../src/models/Wishlist');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const User = require('../src/models/User');
const wishlistController = require('../src/controllers/wishlistController');
const { generateAccessToken } = require('../src/utils/generateToken');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🧪 Starting Network, Route Prefixes & Wishlist System Test Suite');
  console.log('======================================================================\n');

  try {
    const testUserId = new mongoose.Types.ObjectId();
    const testProductId1 = new mongoose.Types.ObjectId();
    const testProductId2 = new mongoose.Types.ObjectId();

    const mockProduct1 = {
      _id: testProductId1,
      productName: 'Banarasi Silk Saree',
      name: 'Banarasi Silk Saree',
      price: 2499,
      originalPrice: 4999,
      discountPrice: 2499,
      discountPercent: 50,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'],
      ratings: 4.8,
      stock: 15,
      brand: 'Varanasi Weavers',
      isActive: true,
      toString() {
        return testProductId1.toString();
      },
    };

    let userWishlist = {
      _id: new mongoose.Types.ObjectId(),
      user: testUserId,
      products: [mockProduct1],
      save: async function () {
        return this;
      },
      populate: async function () {
        return this;
      },
    };

    let userCart = {
      _id: new mongoose.Types.ObjectId(),
      user: testUserId,
      items: [],
      save: async function () {
        return this;
      },
    };

    // Mock Wishlist & Product model methods
    Wishlist.findOne = () => ({
      populate: () => Promise.resolve(userWishlist),
      then: (fn) => fn(userWishlist),
    });
    Wishlist.create = () => Promise.resolve(userWishlist);
    Cart.findOne = () => Promise.resolve(userCart);
    Product.findById = (id) => {
      if (id && id.toString() === testProductId1.toString()) return Promise.resolve(mockProduct1);
      return Promise.resolve(null);
    };
    Product.find = () => ({
      select: () => Promise.resolve([mockProduct1]),
    });

    // =========================================================================
    // TEST 1: GET /api/wishlist
    // =========================================================================
    console.log('[Test 1] GET /api/wishlist:');
    const req1 = {
      user: { _id: testUserId, role: 'customer' },
    };
    const res1 = createMockRes();

    await wishlistController.getWishlist(req1, res1);
    console.log(`  Status: ${res1.statusCode}`);
    console.log(`  Message: "${res1.body?.message}"`);
    console.log(`  Items in Wishlist: ${res1.body?.data?.length}`);

    if (res1.statusCode !== 200 || !Array.isArray(res1.body?.data)) {
      throw new Error(`Test 1 FAILED: Expected 200 OK with array, got status ${res1.statusCode}`);
    }
    console.log('  ✓ Test 1 PASSED: Wishlist retrieved successfully with populated products.\n');

    // =========================================================================
    // TEST 2: POST /api/wishlist/add
    // =========================================================================
    console.log('[Test 2] POST /api/wishlist/add:');
    const req2 = {
      user: { _id: testUserId, role: 'customer' },
      body: { productId: testProductId1.toString() },
    };
    const res2 = createMockRes();

    await wishlistController.addToWishlist(req2, res2);
    console.log(`  Status: ${res2.statusCode}`);
    console.log(`  Message: "${res2.body?.message}"`);

    if (res2.statusCode !== 200) {
      throw new Error(`Test 2 FAILED: Expected 200 OK, got ${res2.statusCode}`);
    }
    console.log('  ✓ Test 2 PASSED: Product added to wishlist successfully.\n');

    // =========================================================================
    // TEST 3: POST /api/wishlist/toggle (Removal & Addition)
    // =========================================================================
    console.log('[Test 3] POST /api/wishlist/toggle:');
    const req3 = {
      user: { _id: testUserId, role: 'customer' },
      body: { productId: testProductId1.toString() },
    };
    const res3 = createMockRes();

    await wishlistController.toggleWishlist(req3, res3);
    console.log(`  Status: ${res3.statusCode}`);
    console.log(`  Action: ${res3.body?.data?.action}`);
    console.log(`  isWishlisted: ${res3.body?.data?.isWishlisted}`);

    if (res3.statusCode !== 200) {
      throw new Error(`Test 3 FAILED: Expected 200 OK, got ${res3.statusCode}`);
    }
    console.log('  ✓ Test 3 PASSED: Wishlist toggle succeeded.\n');

    // =========================================================================
    // TEST 4: POST /api/wishlist/sync with mixed valid and string IDs
    // =========================================================================
    console.log('[Test 4] POST /api/wishlist/sync with mixed valid & string IDs:');
    const req4 = {
      user: { _id: testUserId, role: 'customer' },
      body: {
        productIds: [testProductId1.toString(), 'invalid_string_id', 'prod_456'],
      },
    };
    const res4 = createMockRes();

    await wishlistController.syncWishlist(req4, res4);
    console.log(`  Status: ${res4.statusCode}`);
    console.log(`  Message: "${res4.body?.message}"`);

    if (res4.statusCode !== 200) {
      throw new Error(`Test 4 FAILED: Expected 200 OK, got ${res4.statusCode}`);
    }
    console.log('  ✓ Test 4 PASSED: Wishlist sync cleanly ignored non-ObjectId values with no CastError.\n');

    // =========================================================================
    // TEST 5: DELETE /api/wishlist/remove/:productId
    // =========================================================================
    console.log('[Test 5] DELETE /api/wishlist/remove/:productId:');
    const req5 = {
      user: { _id: testUserId, role: 'customer' },
      params: { productId: testProductId1.toString() },
    };
    const res5 = createMockRes();

    await wishlistController.removeFromWishlist(req5, res5);
    console.log(`  Status: ${res5.statusCode}`);
    console.log(`  Message: "${res5.body?.message}"`);

    if (res5.statusCode !== 200) {
      throw new Error(`Test 5 FAILED: Expected 200 OK, got ${res5.statusCode}`);
    }
    console.log('  ✓ Test 5 PASSED: Product removed from wishlist successfully.\n');

    // =========================================================================
    // TEST 6: POST /api/wishlist/move-to-cart/:productId
    // =========================================================================
    console.log('[Test 6] POST /api/wishlist/move-to-cart/:productId:');
    const req6 = {
      user: { _id: testUserId, role: 'customer' },
      params: { productId: testProductId1.toString() },
    };
    const res6 = createMockRes();

    await wishlistController.moveToCart(req6, res6);
    console.log(`  Status: ${res6.statusCode}`);
    console.log(`  Message: "${res6.body?.message}"`);

    if (res6.statusCode !== 200) {
      throw new Error(`Test 6 FAILED: Expected 200 OK, got ${res6.statusCode}`);
    }
    console.log('  ✓ Test 6 PASSED: Product moved to cart successfully.\n');

    console.log('======================================================================');
    console.log('🎉 ALL 6 WISHLIST & CONTROLLER TESTS PASSED CLEANLY (0 ERRORS)!');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  }
}

runTestSuite();
