/**
 * Comprehensive Automated Verification Test Suite for:
 * Delivery Capacity, Seller Assignment, Partner Acceptance, Decline, Cancellation,
 * Completion, Duplicate Requests, and Concurrent Acceptance Race Conditions.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const path = require('path');
const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DeliveryPartner = require('../src/models/DeliveryPartner');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const Delivery = require('../src/models/Delivery');
const SellerOrder = require('../src/models/SellerOrder');
const Order = require('../src/models/Order');
const Seller = require('../src/models/Seller');
const {
  ACTIVE_DELIVERY_STATUSES,
  INACTIVE_DELIVERY_STATUSES,
  countActualActiveDeliveries,
  syncPartnerActiveCount,
  getPartnerCapacityInfo,
} = require('../src/utils/deliveryCapacityUtils');

const sellerDeliveryController = require('../src/controllers/seller/sellerDeliveryController');
const deliveryOperationsController = require('../src/controllers/delivery/deliveryOperationsController');

// Helper to mock express req/res
function mockReqRes(reqData = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    seller: null,
    deliveryPartner: null,
    ...reqData,
  };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
  };

  return { req, res };
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE DELIVERY CAPACITY BUG FIX VERIFICATION TESTS');
  console.log('========================================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✓ Connected to MongoDB.\n');

    // -------------------------------------------------------------
    // Test 1: Verify Delivery Partner foli's Capacity Calculation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Foli Partner Capacity Calculation Verification ---');
    const foli = await DeliveryPartner.findById('6ae9b93cc884efcf432d3e86');
    assert(foli, 'Partner foli should exist in database');

    const foliCapacity = await getPartnerCapacityInfo(foli);
    console.log('Foli capacity info:', foliCapacity);

    assert.strictEqual(foliCapacity.actualActive, 0, 'Foli actual active deliveries must be 0');
    assert.strictEqual(foliCapacity.activeCapacity, 3, 'Foli maximum active capacity is 3');
    assert.strictEqual(foliCapacity.capacityAvailable, 3, 'Foli capacityAvailable must be 3 (not -2)');
    assert.strictEqual(foliCapacity.capacityAvailable >= 0, true, 'capacityAvailable must never be negative');
    console.log('✓ TEST 1 PASSED: Foli capacity correctly calculated as 3 available slots out of 3.\n');

    // -------------------------------------------------------------
    // Test 2: Eligible Partners API returns correct capacity
    // -------------------------------------------------------------
    console.log('--- TEST 2: Eligible Partners API Response Verification ---');
    const { req: reqEligible, res: resEligible } = mockReqRes({
      query: { city: 'Jaipur' },
    });

    await sellerDeliveryController.getEligiblePartners(reqEligible, resEligible);
    assert.strictEqual(resEligible.getStatusCode(), 200, 'Eligible partners API should return 200');
    const eligibleData = resEligible.getResponseData();
    assert(eligibleData.success, 'Response success must be true');

    const foliInList = eligibleData.partners.find(p => p._id.toString() === foli._id.toString());
    assert(foliInList, 'Foli must be present in eligible partners list');
    console.log('Foli entry in eligible list:', {
      name: foliInList.name,
      activeTasks: foliInList.activeTasks,
      activeCapacity: foliInList.activeCapacity,
      capacityAvailable: foliInList.capacityAvailable,
      isAssignable: foliInList.isAssignable,
    });

    assert.strictEqual(foliInList.activeTasks, 0, 'Foli activeTasks must be 0 in eligible API');
    assert.strictEqual(foliInList.capacityAvailable, 3, 'Foli capacityAvailable must be 3 in eligible API');
    assert.strictEqual(foliInList.isAssignable, true, 'Foli must be assignable with available capacity');
    console.log('✓ TEST 2 PASSED: Eligible partners API returns non-negative available capacity.\n');

    // -------------------------------------------------------------
    // Test Setup: Create isolated test seller, partner and orders
    // -------------------------------------------------------------
    console.log('--- Setting up isolated test environment ---');
    const testTimestamp = Date.now();

    // Create test seller
    let testSeller = await Seller.findOne({ email: 'test_cap_seller@appecom.in' });
    if (!testSeller) {
      testSeller = await Seller.create({
        name: 'Capacity Test Seller',
        email: 'test_cap_seller@appecom.in',
        password: 'SellerPassword123!',
        phone: '9829099999',
        storeName: 'Capacity Test Hub',
        kycStatus: 'approved',
        status: 'approved',
        isApproved: true,
      });
    }

    // Create a dedicated test partner with capacity = 2
    const testPartnerEmail = `cap_rider_${testTimestamp}@appecom.in`;
    const testPartner = await DeliveryPartner.create({
      name: `Rider-${testTimestamp}`,
      email: testPartnerEmail,
      phone: `99${testTimestamp.toString().slice(-8)}`,
      password: 'password123',
      vehicleType: 'Bike',
      vehicleNumber: 'DL-99-TEST-1',
      kycStatus: 'approved',
      availability: 'online',
      isAvailable: true,
      activeCapacity: 2,
      currentActiveDeliveries: 0,
    });

    console.log(`Created test rider: ${testPartner.name} with capacity: ${testPartner.activeCapacity}`);

    // Create 3 test orders
    const testOrderNums = [
      `TEST-CAP-${testTimestamp}-1`,
      `TEST-CAP-${testTimestamp}-2`,
      `TEST-CAP-${testTimestamp}-3`,
    ];

    const dummyUserId = new mongoose.Types.ObjectId();
    const testOrders = [];
    for (const ordNum of testOrderNums) {
      const pOrder = await Order.create({
        orderId: ordNum,
        orderNumber: ordNum,
        user: dummyUserId,
        totalAmount: 999,
        orderStatus: 'Placed',
        deliveryAddress: {
          fullName: 'Test Customer',
          addressLine1: 'MI Road',
          city: 'Jaipur',
          state: 'Rajasthan',
          pinCode: '302001',
          mobileNumber: '9876543210',
        },
      });

      const sOrder = await SellerOrder.create({
        orderNumber: ordNum,
        subOrderNumber: `SO-${ordNum}`,
        order: pOrder._id,
        user: dummyUserId,
        seller: testSeller._id,
        status: 'ready_for_pickup',
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        subtotal: 999,
        netEarnings: 899.1,
        commissionAmount: 99.9,
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine: 'MI Road',
          city: 'Jaipur',
          state: 'Rajasthan',
          pinCode: '302001',
          mobileNumber: '9876543210',
        },
      });

      testOrders.push({ pOrder, sOrder, orderNumber: ordNum });
    }

    // -------------------------------------------------------------
    // Test 3: Seller Assignment does NOT increment active deliveries
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Seller Assignment Does Not Prematurely Increment Active Count ---');
    const { req: reqAssign1, res: resAssign1 } = mockReqRes({
      seller: testSeller,
      body: {
        orderId: testOrders[0].orderNumber,
        deliveryPartnerId: testPartner._id.toString(),
      },
    });

    await sellerDeliveryController.assignDeliveryPartner(reqAssign1, resAssign1);
    assert.strictEqual(resAssign1.getStatusCode(), 201, 'Assignment 1 must succeed');
    const assignData1 = resAssign1.getResponseData();
    assert(assignData1.success, 'Assignment response success must be true');

    // Verify partner capacity in DB has NOT incremented
    const partnerAfterAssign = await DeliveryPartner.findById(testPartner._id);
    const activeCountAfterAssign = await countActualActiveDeliveries(testPartner._id);
    assert.strictEqual(activeCountAfterAssign, 0, 'Actual active deliveries must still be 0 after assignment');
    assert.strictEqual(partnerAfterAssign.currentActiveDeliveries, 0, 'Partner currentActiveDeliveries field must not increment before acceptance');
    assert.strictEqual((partnerAfterAssign.assignedTasks || []).length, 0, 'Unaccepted tasks must not be pushed into partner.assignedTasks');
    console.log('✓ TEST 3 PASSED: Active count remains 0 upon request dispatch.\n');

    // -------------------------------------------------------------
    // Test 4: Prevent Duplicate Assignment for the same order
    // -------------------------------------------------------------
    console.log('--- TEST 4: Prevent Duplicate Assignment for Same Order ---');
    const { req: reqDup, res: resDup } = mockReqRes({
      seller: testSeller,
      body: {
        orderId: testOrders[0].orderNumber,
        deliveryPartnerId: testPartner._id.toString(),
      },
    });

    await sellerDeliveryController.assignDeliveryPartner(reqDup, resDup);
    assert.strictEqual(resDup.getStatusCode(), 400, 'Duplicate assignment must return 400');
    assert.strictEqual(resDup.getResponseData().success, false);
    assert(resDup.getResponseData().message.includes('already has an active assignment'), 'Message must indicate active assignment exists');
    console.log('✓ TEST 4 PASSED: Duplicate assignment for the same order cleanly blocked.\n');

    // -------------------------------------------------------------
    // Test 5: Delivery Partner Acceptance Increments Active Count Exactly Once
    // -------------------------------------------------------------
    console.log('--- TEST 5: Acceptance Logic & Exact Single Increment ---');
    const assignment1 = assignData1.assignment;

    const { req: reqAccept1, res: resAccept1 } = mockReqRes({
      deliveryPartner: testPartner,
      params: { assignmentId: assignment1.assignmentId },
    });

    await deliveryOperationsController.acceptRequest(reqAccept1, resAccept1);
    assert.strictEqual(resAccept1.getStatusCode(), 200, 'Accept request must return 200');
    const acceptData1 = resAccept1.getResponseData();
    assert(acceptData1.success, 'Acceptance must be successful');
    assert(acceptData1.delivery, 'Delivery record must be created');

    const partnerAfterAccept = await DeliveryPartner.findById(testPartner._id);
    const actualAfterAccept = await countActualActiveDeliveries(testPartner._id);
    assert.strictEqual(actualAfterAccept, 1, 'Actual active deliveries must now be exactly 1');
    assert.strictEqual(partnerAfterAccept.currentActiveDeliveries, 1, 'currentActiveDeliveries field must be exactly 1');
    console.log('✓ TEST 5 PASSED: Partner acceptance incremented active delivery count to exactly 1.\n');

    // -------------------------------------------------------------
    // Test 6: Second Assignment and Acceptance (reaches capacity = 2)
    // -------------------------------------------------------------
    console.log('--- TEST 6: Second Assignment and Acceptance (Reaching Max Capacity 2/2) ---');
    const { req: reqAssign2, res: resAssign2 } = mockReqRes({
      seller: testSeller,
      body: {
        orderId: testOrders[1].orderNumber,
        deliveryPartnerId: testPartner._id.toString(),
      },
    });

    await sellerDeliveryController.assignDeliveryPartner(reqAssign2, resAssign2);
    assert.strictEqual(resAssign2.getStatusCode(), 201, 'Assignment 2 must succeed');
    const assignData2 = resAssign2.getResponseData();

    const { req: reqAccept2, res: resAccept2 } = mockReqRes({
      deliveryPartner: testPartner,
      params: { assignmentId: assignData2.assignment.assignmentId },
    });

    await deliveryOperationsController.acceptRequest(reqAccept2, resAccept2);
    assert.strictEqual(resAccept2.getStatusCode(), 200, 'Acceptance 2 must succeed');

    const partnerAtCapacity = await DeliveryPartner.findById(testPartner._id);
    const actualAtCapacity = await countActualActiveDeliveries(testPartner._id);
    assert.strictEqual(actualAtCapacity, 2, 'Actual active deliveries must be 2');
    assert.strictEqual(partnerAtCapacity.currentActiveDeliveries, 2, 'currentActiveDeliveries must be 2');

    const capInfoAtMax = await getPartnerCapacityInfo(partnerAtCapacity);
    assert.strictEqual(capInfoAtMax.capacityAvailable, 0, 'Available capacity must be 0');
    assert.strictEqual(capInfoAtMax.isAssignable, false, 'Partner must NOT be assignable when capacity is full');
    console.log('✓ TEST 6 PASSED: Partner capacity is now 2/2 with 0 available slots.\n');

    // -------------------------------------------------------------
    // Test 7: Seller cannot assign when partner has 0 available capacity
    // -------------------------------------------------------------
    console.log('--- TEST 7: Seller Assignment Blocked When Capacity Available is 0 ---');
    const { req: reqAssign3, res: resAssign3 } = mockReqRes({
      seller: testSeller,
      body: {
        orderId: testOrders[2].orderNumber,
        deliveryPartnerId: testPartner._id.toString(),
      },
    });

    await sellerDeliveryController.assignDeliveryPartner(reqAssign3, resAssign3);
    assert.strictEqual(resAssign3.getStatusCode(), 400, 'Assignment must be rejected with 400 when capacity is 0');
    const assignFailData = resAssign3.getResponseData();
    assert.strictEqual(assignFailData.success, false);
    assert(assignFailData.message.includes('has no available capacity'), 'Message must state partner has no available capacity');
    console.log('✓ TEST 7 PASSED: Assignment correctly blocked due to zero available capacity.\n');

    // -------------------------------------------------------------
    // Test 8: Concurrent / Simultaneous Acceptance Race Condition Prevention
    // -------------------------------------------------------------
    console.log('--- TEST 8: Concurrent / Simultaneous Acceptance Race Condition Prevention ---');
    // Create an assignment directly in DB for concurrent acceptance test
    const concurrentOrderNum = `CONC-${testTimestamp}`;
    const concAssignment = await DeliveryAssignment.create({
      assignmentId: `ASGN-CONC-${testTimestamp}`,
      order: new mongoose.Types.ObjectId(),
      orderNumber: concurrentOrderNum,
      seller: testSeller._id,
      deliveryPartner: testPartner._id,
      status: 'requested',
      responseDeadline: new Date(Date.now() + 15 * 60 * 1000),
      customerName: 'Concurrent Tester',
    });

    // Both requests attempt to accept the assignment when partner is at capacity (2/2)
    const { req: reqConc1, res: resConc1 } = mockReqRes({
      deliveryPartner: testPartner,
      params: { assignmentId: concAssignment.assignmentId },
    });
    const { req: reqConc2, res: resConc2 } = mockReqRes({
      deliveryPartner: testPartner,
      params: { assignmentId: concAssignment.assignmentId },
    });

    await Promise.all([
      deliveryOperationsController.acceptRequest(reqConc1, resConc1),
      deliveryOperationsController.acceptRequest(reqConc2, resConc2),
    ]);

    // Both must be blocked because capacity is 2/2
    assert.strictEqual(resConc1.getStatusCode(), 400, 'Req 1 must be rejected due to capacity');
    assert.strictEqual(resConc2.getStatusCode(), 400, 'Req 2 must be rejected due to capacity');
    console.log('✓ TEST 8 PASSED: Concurrent acceptances prevented from exceeding partner capacity.\n');

    // -------------------------------------------------------------
    // Test 9: Decline Request Releases Capacity & Updates State Correctly
    // -------------------------------------------------------------
    console.log('--- TEST 9: Partner Decline Request Verification ---');
    const declineOrderNum = `DECL-${testTimestamp}`;
    const declAssignment = await DeliveryAssignment.create({
      assignmentId: `ASGN-DECL-${testTimestamp}`,
      order: new mongoose.Types.ObjectId(),
      orderNumber: declineOrderNum,
      seller: testSeller._id,
      deliveryPartner: testPartner._id,
      status: 'requested',
      responseDeadline: new Date(Date.now() + 15 * 60 * 1000),
      customerName: 'Decline Tester',
    });

    const { req: reqDecline, res: resDecline } = mockReqRes({
      deliveryPartner: testPartner,
      params: { assignmentId: declAssignment.assignmentId },
      body: { reason: 'Vehicle tire puncture' },
    });

    await deliveryOperationsController.declineRequest(reqDecline, resDecline);
    assert.strictEqual(resDecline.getStatusCode(), 200, 'Decline request must return 200');
    const declinedInDB = await DeliveryAssignment.findOne({ assignmentId: declAssignment.assignmentId });
    assert.strictEqual(declinedInDB.status, 'declined', 'Assignment status must be declined');

    // Capacity must not be erroneously decremented below actual ongoing deliveries
    const partnerAfterDecline = await DeliveryPartner.findById(testPartner._id);
    const actualAfterDecline = await countActualActiveDeliveries(testPartner._id);
    assert.strictEqual(partnerAfterDecline.currentActiveDeliveries, actualAfterDecline, 'Partner currentActiveDeliveries must match actual deliveries');
    assert.strictEqual(actualAfterDecline, 2, 'Active deliveries count remains 2 (ongoing deliveries unaffected)');
    console.log('✓ TEST 9 PASSED: Decline request does not cause counter underflow or corrupt state.\n');

    // -------------------------------------------------------------
    // Test 10: Seller Cancellation Releases Active Capacity
    // -------------------------------------------------------------
    console.log('--- TEST 10: Seller Assignment Cancellation Releases Capacity ---');
    const { req: reqCancel, res: resCancel } = mockReqRes({
      seller: testSeller,
      params: { assignmentId: assignData1.assignment.assignmentId },
    });

    await sellerDeliveryController.cancelAssignment(reqCancel, resCancel);
    if (resCancel.getStatusCode() !== 200) {
      console.error('Cancel Assignment Error response:', resCancel.getResponseData());
    }
    assert.strictEqual(resCancel.getStatusCode(), 200, 'Cancel assignment must return 200');

    // Active deliveries count should now drop from 2 to 1
    const actualAfterCancel = await countActualActiveDeliveries(testPartner._id);
    const partnerAfterCancel = await DeliveryPartner.findById(testPartner._id);
    assert.strictEqual(actualAfterCancel, 1, 'Actual ongoing deliveries must now be 1');
    assert.strictEqual(partnerAfterCancel.currentActiveDeliveries, 1, 'Partner currentActiveDeliveries must be 1');

    const capInfoAfterCancel = await getPartnerCapacityInfo(partnerAfterCancel);
    assert.strictEqual(capInfoAfterCancel.capacityAvailable, 1, 'Available capacity must now be 1 slot');
    assert.strictEqual(capInfoAfterCancel.isAssignable, true, 'Partner must now be assignable again');
    console.log('✓ TEST 10 PASSED: Seller cancellation released capacity and updated available slots to 1.\n');

    // -------------------------------------------------------------
    // Test 11: Delivery OTP Verification & Completion Decrements Exactly Once (Idempotent)
    // -------------------------------------------------------------
    console.log('--- TEST 11: Delivery Completion & Idempotent Verification ---');
    const activeDelivery2 = acceptData1.delivery; // DEL-1 was cancelled, DEL-2 is active
    const deliveryRecord2 = await Delivery.findOne({ assignment: assignData2.assignment._id });
    assert(deliveryRecord2, 'Active delivery record 2 must exist');

    const { req: reqComplete, res: resComplete } = mockReqRes({
      deliveryPartner: testPartner,
      params: { deliveryId: deliveryRecord2._id.toString() },
      body: { otp: '4521' },
    });

    await deliveryOperationsController.verifyDeliveryOtp(reqComplete, resComplete);
    assert.strictEqual(resComplete.getStatusCode(), 200, 'First completion call must return 200');

    const actualAfterComplete = await countActualActiveDeliveries(testPartner._id);
    const partnerAfterComplete = await DeliveryPartner.findById(testPartner._id);
    assert.strictEqual(actualAfterComplete, 0, 'All ongoing deliveries are now completed (0 active)');
    assert.strictEqual(partnerAfterComplete.currentActiveDeliveries, 0, 'Partner counter must be 0');

    // Call verifyDeliveryOtp a SECOND time (idempotency check)
    const { req: reqComplete2, res: resComplete2 } = mockReqRes({
      deliveryPartner: testPartner,
      params: { deliveryId: deliveryRecord2._id.toString() },
      body: { otp: '4521' },
    });

    await deliveryOperationsController.verifyDeliveryOtp(reqComplete2, resComplete2);
    assert.strictEqual(resComplete2.getStatusCode(), 200, 'Duplicate completion call must return 200 (idempotent)');

    // Verify counter did NOT double decrement into negative!
    const partnerAfterDupComplete = await DeliveryPartner.findById(testPartner._id);
    assert.strictEqual(partnerAfterDupComplete.currentActiveDeliveries, 0, 'Counter must stay at 0 and NEVER become -1 or negative');
    console.log('✓ TEST 11 PASSED: Completion decremented exactly once; repeated call was strictly idempotent.\n');

    // -------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------
    console.log('--- Cleaning up test records ---');
    await DeliveryPartner.findByIdAndDelete(testPartner._id);
    await DeliveryAssignment.deleteMany({ seller: testSeller._id });
    await Delivery.deleteMany({ seller: testSeller._id });
    await SellerOrder.deleteMany({ seller: testSeller._id });
    await Order.deleteMany({ orderNumber: { $regex: testTimestamp.toString() } });
    console.log('✓ Test data cleaned up successfully.\n');

    console.log('========================================================================');
    console.log('🎉 ALL 11 TESTS PASSED SUCCESSFULLY! FULL LOGISTICS LIFECYCLE VERIFIED.');
    console.log('========================================================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exit(1);
  }
}

runTests();
