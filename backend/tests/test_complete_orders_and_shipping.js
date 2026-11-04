const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const env = require('../src/config/env');
const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const SellerOrder = require('../src/models/SellerOrder');
const User = require('../src/models/User');

// Controllers
const orderController = require('../src/controllers/orderController');
const sellerOrderController = require('../src/controllers/seller/sellerOrderController');
const sellerReturnController = require('../src/controllers/seller/sellerReturnController');

function createMockReqRes(reqData = {}) {
  let resolvePromise;
  const done = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const req = {
    user: reqData.user || { _id: new mongoose.Types.ObjectId(), role: 'customer', email: 'testcustomer@appecom.in' },
    seller: reqData.seller || { _id: new mongoose.Types.ObjectId(), name: 'Test Seller', storeName: 'Test Store' },
    body: reqData.body || {},
    query: reqData.query || {},
    params: reqData.params || {},
    headers: reqData.headers || {},
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      resolvePromise({ statusCode: this.statusCode, body: data });
      return this;
    },
  };

  const next = (err) => {
    if (err) {
      console.error('>>> CONTROLLER NEXT CALLED WITH ERROR:', err.message);
      resolvePromise({ error: err, statusCode: err.statusCode || 500 });
    } else {
      resolvePromise({ statusCode: res.statusCode, body: res.body });
    }
  };

  return { req, res, next, wait: () => done };
}

async function runTests() {
  console.log('--- STARTING ORDERS & SHIPPING COMPLETE VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB');

    // Find an approved seller
    const seller = await Seller.findOne({ status: 'approved' });
    if (!seller) {
      throw new Error('No approved seller found in database');
    }
    console.log(`Using approved seller: ${seller.name} (${seller._id})`);

    // Find an active product owned by this seller
    let product = await Product.findOne({ seller: seller._id, isActive: true });
    if (!product) {
      product = await Product.findOne({ isActive: true });
      if (product) {
        product.seller = seller._id;
        await product.save();
      }
    }
    console.log(`Using product: ${product.productName || product.name} (${product._id})`);

    // Find or mock customer user
    let customerUser = await User.findOne({ role: 'customer' });
    if (!customerUser) {
      customerUser = await User.findOne();
    }

    // =========================================================================
    // TEST 1: Customer Order Placement & Automatic SellerOrder Creation
    // =========================================================================
    console.log('\n[TEST 1] Customer creates order via orderController.createOrder...');
    {
      const { req, res, next, wait } = createMockReqRes({
        user: customerUser,
        body: {
          items: [
            {
              product: product._id,
              quantity: 2,
              price: product.price,
            },
          ],
          deliveryAddress: {
            fullName: 'Harish Mehta',
            phone: '9829098765',
            addressLine1: 'B-12, Malviya Nagar',
            city: 'Jaipur',
            state: 'Rajasthan',
            pinCode: '302017',
          },
          paymentMethod: 'Cash on Delivery',
        },
      });

      orderController.createOrder(req, res, next);
      await wait();

      if (res.statusCode === 201 || res.statusCode === 200) {
        const orderId = res.body?.data?.order?._id || res.body?.data?.order?.orderId;
        console.log(`✓ Order placed successfully with ID: ${orderId}`);

        // Verify SellerOrder was created in DB for the seller
        const sellerOrder = await SellerOrder.findOne({
          order: res.body?.data?.order?._id,
          seller: seller._id,
        });

        if (sellerOrder) {
          console.log(`✓ Corresponding SellerOrder created: ${sellerOrder.subOrderNumber}, status: ${sellerOrder.status}`);
          console.log(`  Customer: ${sellerOrder.customerName}, Phone: ${sellerOrder.customerPhone}`);
          console.log(`  Items count: ${sellerOrder.itemCount}, Subtotal: ₹${sellerOrder.subtotal}`);
          passed++;
        } else {
          console.error('✗ Failed: SellerOrder not found for seller!');
          failed++;
        }
      } else {
        console.error('✗ Failed to create order:', res.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 2: Seller Orders List & Status Filtering (sellerOrderController.getOrders)
    // =========================================================================
    console.log('\n[TEST 2] Seller retrieves orders list with status filter...');
    {
      const { req, res, next, wait } = createMockReqRes({
        seller: seller,
        query: { status: 'all', limit: 10 },
      });

      sellerOrderController.getOrders(req, res, next);
      await wait();
      const orders = res.body?.data?.orders || [];
      const totalCount = res.body?.data?.totalCount || 0;

      if (res.statusCode === 200 && orders.length > 0) {
        console.log(`✓ Seller orders retrieved: ${orders.length} orders returned (Total in DB: ${totalCount})`);
        passed++;
      } else {
        console.error('✗ Failed to retrieve seller orders:', res.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 3: Order Details View (sellerOrderController.getOrder)
    // =========================================================================
    console.log('\n[TEST 3] Seller retrieves specific order details...');
    let targetOrder = await SellerOrder.findOne({ seller: seller._id, status: { $in: ['new', 'pending'] } });
    if (!targetOrder) {
      targetOrder = await SellerOrder.findOne({ seller: seller._id });
    }

    {
      const { req, res, next, wait } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
      });

      sellerOrderController.getOrder(req, res, next);
      await wait();
      const fetchedOrder = res.body?.data?.order;

      if (res.statusCode === 200 && fetchedOrder) {
        console.log(`✓ Order details retrieved: ${fetchedOrder.subOrderNumber}`);
        console.log(`  Address: ${fetchedOrder.shippingAddress?.addressLine1}, PIN: ${fetchedOrder.shippingAddress?.pinCode}`);
        passed++;
      } else {
        console.error('✗ Failed to fetch order details:', res.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 4: Order Status Workflow State Machine (Accept, Process, Pack)
    // =========================================================================
    console.log('\n[TEST 4] Testing workflow status transitions (pending -> accepted -> processing -> packed)...');
    {
      // Transition: pending -> accepted
      targetOrder.status = 'pending';
      await targetOrder.save();

      const { req: req1, res: res1, next: next1, wait: wait1 } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: { status: 'accepted' },
      });
      sellerOrderController.updateOrderStatus(req1, res1, next1);
      await wait1();

      // Transition: accepted -> processing
      const { req: req2, res: res2, next: next2, wait: wait2 } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: { status: 'processing' },
      });
      sellerOrderController.updateOrderStatus(req2, res2, next2);
      await wait2();

      // Transition: processing -> packed
      const { req: req3, res: res3, next: next3, wait: wait3 } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: { status: 'packed' },
      });
      sellerOrderController.updateOrderStatus(req3, res3, next3);
      await wait3();

      const refreshed = await SellerOrder.findById(targetOrder._id);
      if (refreshed.status === 'packed') {
        console.log(`✓ Successfully completed lifecycle transition to 'packed'!`);
        console.log(`  Tracking events recorded: ${refreshed.shipping?.trackingHistory?.length || 0}`);
        passed++;
      } else {
        console.error(`✗ Status transition failed. Current status: ${refreshed.status}`);
        failed++;
      }
    }

    // =========================================================================
    // TEST 5: Mandatory Rejection Reason Validation
    // =========================================================================
    console.log('\n[TEST 5] Testing mandatory reason enforcement on rejection...');
    {
      // Attempt rejection without reason (must fail with HTTP 400)
      const { req: reqFail, res: resFail, next: nextFail, wait: waitFail } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: { status: 'rejected' }, // No reason
      });
      sellerOrderController.updateOrderStatus(reqFail, resFail, nextFail);
      await waitFail();

      if (resFail.statusCode === 400) {
        console.log(`✓ Properly rejected attempt without reason: "${resFail.body?.message}"`);
        passed++;
      } else {
        console.error('✗ Rejection without reason was incorrectly allowed!');
        failed++;
      }
    }

    // =========================================================================
    // TEST 6: Generate Shipping Label with Courier Partner & Dimensions
    // =========================================================================
    console.log('\n[TEST 6] Generating Shipping Label with courier & dimensions...');
    {
      const { req, res, next, wait } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: {
          courierPartner: 'BlueDart',
          weight: 0.9,
          dimensions: { length: 24, width: 18, height: 10 },
        },
      });

      sellerOrderController.generateShippingLabel(req, res, next);
      await wait();
      const updated = res.body?.data?.order;

      if (res.statusCode === 200 && updated && updated.shipping?.awbNumber) {
        console.log(`✓ Shipping label generated successfully!`);
        console.log(`  Courier: ${updated.shipping.courierName}, AWB: ${updated.shipping.awbNumber}`);
        console.log(`  Weight: ${updated.shipping.weight} kg, Dim: ${JSON.stringify(updated.shipping.dimensions)}`);
        console.log(`  New Status: ${updated.status}`);
        passed++;
      } else {
        console.error('✗ Failed to generate shipping label:', res.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 7: Schedule Pickup & Shipment Cancellation
    // =========================================================================
    console.log('\n[TEST 7] Scheduling Courier Pickup & Shipment cancellation...');
    {
      const { req: reqPickup, res: resPickup, next: nextPickup, wait: waitPickup } = createMockReqRes({
        seller: seller,
        params: { id: targetOrder._id.toString() },
        body: {
          pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          pickupSlot: 'Morning (10:00 AM - 01:00 PM)',
        },
      });

      sellerOrderController.schedulePickup(reqPickup, resPickup, nextPickup);
      await waitPickup();
      const pickupOrder = resPickup.body?.data?.order;

      if (resPickup.statusCode === 200 && pickupOrder?.status === 'pickup_scheduled') {
        console.log(`✓ Pickup scheduled successfully: ${pickupOrder.shipping?.pickupSlot}`);

        // Now test cancellation
        const { req: reqCancel, res: resCancel, next: nextCancel, wait: waitCancel } = createMockReqRes({
          seller: seller,
          params: { id: targetOrder._id.toString() },
          body: { reason: 'Packaging damaged, re-packing required' },
        });

        sellerOrderController.cancelShipment(reqCancel, resCancel, nextCancel);
        await waitCancel();
        const cancelledOrder = resCancel.body?.data?.order;

        if (resCancel.statusCode === 200 && cancelledOrder?.status === 'packed') {
          console.log(`✓ Shipment successfully cancelled and reverted to 'packed'!`);
          passed++;
        } else {
          console.error('✗ Failed to cancel shipment:', resCancel.body);
          failed++;
        }
      } else {
        console.error('✗ Failed to schedule pickup:', resPickup.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 8: Order Statistics API (10 Statuses)
    // =========================================================================
    console.log('\n[TEST 8] Fetching Comprehensive Order Statistics...');
    {
      const { req, res, next, wait } = createMockReqRes({ seller: seller });
      sellerOrderController.getOrderStatistics(req, res, next);
      await wait();

      const stats = res.body?.data;
      if (res.statusCode === 200 && stats) {
        console.log(`✓ Order statistics retrieved:`);
        console.log(`  Total: ${stats.totalOrders}, New: ${stats.newOrders}, Pending: ${stats.pendingOrders}`);
        console.log(`  Confirmed: ${stats.confirmedOrders}, Processing: ${stats.processingOrders}`);
        console.log(`  Ready to Ship: ${stats.readyToShipOrders}, Shipped: ${stats.shippedOrders}`);
        console.log(`  Delivered: ${stats.deliveredOrders}, Cancelled: ${stats.cancelledOrders}, Returned: ${stats.returnedOrders}`);
        passed++;
      } else {
        console.error('✗ Failed to get order statistics:', res.body);
        failed++;
      }
    }

    // =========================================================================
    // TEST 9: Returns & Refunds Management
    // =========================================================================
    console.log('\n[TEST 9] Returns & Refunds Management (getReturnRequests & decision)...');
    {
      const { req: reqReturns, res: resReturns, next: nextReturns, wait: waitReturns } = createMockReqRes({
        seller: seller,
        query: { status: 'all' },
      });

      sellerReturnController.getReturnRequests(reqReturns, resReturns, nextReturns);
      await waitReturns();
      const returnList = resReturns.body?.data?.returns || [];

      if (resReturns.statusCode === 200) {
        console.log(`✓ Return requests retrieved: ${returnList.length} items`);
        if (returnList.length > 0) {
          const testRet = returnList[0];
          const { req: reqDec, res: resDec, next: nextDec, wait: waitDec } = createMockReqRes({
            seller: seller,
            params: { id: testRet._id.toString() },
            body: { decision: 'approved', notes: 'Approved for exchange / reverse pickup' },
          });

          sellerReturnController.handleReturnDecision(reqDec, resDec, nextDec);
          await waitDec();
          if (resDec.statusCode === 200) {
            console.log(`✓ Return request successfully approved!`);
          }
        }
        passed++;
      } else {
        console.error('✗ Failed to get returns:', resReturns.body);
        failed++;
      }
    }

    console.log(`\n==================================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  }
}

runTests();
