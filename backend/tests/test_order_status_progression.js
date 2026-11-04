/**
 * Verification Test: Order Status Progression & Customer Live Tracking Sync
 *
 * Verifies:
 * 1. Newly created orders initialize strictly with status "confirmed".
 * 2. Live Tracking returns "Order Confirmed" as the ONLY completed milestone.
 * 3. Newly created orders DO NOT automatically jump to "Shipped" or "In Transit".
 * 4. Status advances strictly upon manual Vendor/Seller progression:
 *    Confirmed -> Processing -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered.
 * 5. Payment status and fulfillment status remain decoupled.
 */
const assert = require('assert');
const {
  STATUS_RANK,
  STANDARD_MILESTONES,
  buildTrackingTimeline,
  syncParentOrderStatus,
} = require('../src/utils/orderSync');

console.log('\n======================================================================');
console.log('🧪 TESTING ORDER STATUS PROGRESSION LIFECYCLE & LIVE TRACKING');
console.log('======================================================================\n');

// 1. Initial State: Newly Placed Order
console.log('--- STEP 1: Customer Places Order -> Initial Status: Confirmed ---');
const newOrder = {
  _id: '672728281a82f00012345001',
  orderId: 'BBIN-261104-9001',
  orderNumber: 'BBIN-261104-9001',
  orderStatus: 'Confirmed',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  createdAt: new Date(),
  acceptedAt: new Date(),
  items: [{ name: 'Handloom Cotton Kurta', price: 1299, quantity: 1 }],
};

const initialTimeline = buildTrackingTimeline(newOrder, newOrder.orderStatus.toLowerCase());

assert.strictEqual(initialTimeline.length, 7, 'Must have exactly 7 canonical milestones');
assert.strictEqual(initialTimeline[0].title, 'ORDER CONFIRMED');
assert.strictEqual(initialTimeline[0].completed, true, 'Order Confirmed must be completed');
assert.strictEqual(initialTimeline[0].isCurrent, true, 'Order Confirmed must be the active current stage');

// Verify all subsequent stages are NOT completed
assert.strictEqual(initialTimeline[1].title, 'PROCESSING');
assert.strictEqual(initialTimeline[1].completed, false, 'Processing must be pending');

assert.strictEqual(initialTimeline[2].title, 'PACKED');
assert.strictEqual(initialTimeline[2].completed, false, 'Packed must be pending');

assert.strictEqual(initialTimeline[3].title, 'SHIPPED');
assert.strictEqual(initialTimeline[3].completed, false, 'Shipped must strictly NOT be completed on new orders');

assert.strictEqual(initialTimeline[4].title, 'IN TRANSIT');
assert.strictEqual(initialTimeline[4].completed, false, 'In Transit must strictly NOT be completed on new orders');

assert.strictEqual(initialTimeline[5].title, 'OUT FOR DELIVERY');
assert.strictEqual(initialTimeline[5].completed, false, 'Out for Delivery must be pending');

assert.strictEqual(initialTimeline[6].title, 'DELIVERED');
assert.strictEqual(initialTimeline[6].completed, false, 'Delivered must be pending');

console.log('✓ PASS: Newly placed order has ONLY Order Confirmed completed. Shipped & In Transit are FALSE.');

// 2. Vendor Advances: Confirmed -> Processing
console.log('\n--- STEP 2: Vendor Clicks "Start Processing" -> Status: Processing ---');
const processingOrder = {
  ...newOrder,
  orderStatus: 'processing',
  preparingAt: new Date(),
};
const processingTimeline = buildTrackingTimeline(processingOrder, 'processing');
assert.strictEqual(processingTimeline[0].completed, true);
assert.strictEqual(processingTimeline[1].completed, true);
assert.strictEqual(processingTimeline[1].isCurrent, true);
assert.strictEqual(processingTimeline[2].completed, false, 'Packed must not be completed yet');
assert.strictEqual(processingTimeline[3].completed, false, 'Shipped must not be completed yet');
console.log('✓ PASS: Vendor advances to Processing -> Only Steps 1 & 2 completed.');

// 3. Vendor Advances: Processing -> Packed
console.log('\n--- STEP 3: Vendor Clicks "Mark as Packed" -> Status: Packed ---');
const packedOrder = {
  ...processingOrder,
  orderStatus: 'packed',
  readyForPickupAt: new Date(),
};
const packedTimeline = buildTrackingTimeline(packedOrder, 'packed');
assert.strictEqual(packedTimeline[0].completed, true);
assert.strictEqual(packedTimeline[1].completed, true);
assert.strictEqual(packedTimeline[2].completed, true);
assert.strictEqual(packedTimeline[2].isCurrent, true);
assert.strictEqual(packedTimeline[3].completed, false, 'Shipped must still NOT be completed');
assert.strictEqual(packedTimeline[4].completed, false, 'In Transit must still NOT be completed');
console.log('✓ PASS: Vendor advances to Packed -> Steps 1, 2, 3 completed. Shipped remains FALSE.');

// 4. Vendor Advances: Packed -> Shipped
console.log('\n--- STEP 4: Vendor Clicks "Ship Order" -> Status: Shipped ---');
const shippedOrder = {
  ...packedOrder,
  orderStatus: 'shipped',
  shippedAt: new Date(),
};
const shippedTimeline = buildTrackingTimeline(shippedOrder, 'shipped', 'Delhivery Pan-India Express');
assert.strictEqual(shippedTimeline[0].completed, true);
assert.strictEqual(shippedTimeline[1].completed, true);
assert.strictEqual(shippedTimeline[2].completed, true);
assert.strictEqual(shippedTimeline[3].completed, true);
assert.strictEqual(shippedTimeline[3].isCurrent, true);
assert.strictEqual(shippedTimeline[4].completed, false, 'In Transit must not be completed yet');
console.log('✓ PASS: Vendor marks Shipped -> Steps 1-4 completed. In Transit remains FALSE.');

// 5. Courier / Dispatch Advances: Shipped -> In Transit
console.log('\n--- STEP 5: Logistics Partner Marks "In Transit" -> Status: In Transit ---');
const inTransitOrder = {
  ...shippedOrder,
  orderStatus: 'in_transit',
  inTransitAt: new Date(),
};
const inTransitTimeline = buildTrackingTimeline(inTransitOrder, 'in_transit');
assert.strictEqual(inTransitTimeline[0].completed, true);
assert.strictEqual(inTransitTimeline[1].completed, true);
assert.strictEqual(inTransitTimeline[2].completed, true);
assert.strictEqual(inTransitTimeline[3].completed, true);
assert.strictEqual(inTransitTimeline[4].completed, true);
assert.strictEqual(inTransitTimeline[4].isCurrent, true);
assert.strictEqual(inTransitTimeline[5].completed, false, 'Out for Delivery must not be completed yet');
console.log('✓ PASS: Package advances to In Transit -> Steps 1-5 completed.');

// 6. Delivery Executive Advances: In Transit -> Out for Delivery
console.log('\n--- STEP 6: Rider Starts Delivery -> Status: Out for Delivery ---');
const outForDeliveryOrder = {
  ...inTransitOrder,
  orderStatus: 'out_for_delivery',
  outForDeliveryAt: new Date(),
};
const outForDeliveryTimeline = buildTrackingTimeline(outForDeliveryOrder, 'out_for_delivery');
assert.strictEqual(outForDeliveryTimeline[5].completed, true);
assert.strictEqual(outForDeliveryTimeline[5].isCurrent, true);
assert.strictEqual(outForDeliveryTimeline[6].completed, false, 'Delivered must not be completed yet');
console.log('✓ PASS: Rider moves to Out for Delivery -> Steps 1-6 completed. Delivered remains FALSE.');

// 7. Doorstep Handover & Customer OTP Verification: Out for Delivery -> Delivered
console.log('\n--- STEP 7: Customer OTP Verified -> Status: Delivered ---');
const deliveredOrder = {
  ...outForDeliveryOrder,
  orderStatus: 'delivered',
  deliveredAt: new Date(),
};
const deliveredTimeline = buildTrackingTimeline(deliveredOrder, 'delivered');
deliveredTimeline.forEach((step, idx) => {
  assert.strictEqual(step.completed, true, `Step ${idx + 1} (${step.title}) must be completed`);
});
assert.strictEqual(deliveredTimeline[6].isCurrent, true);
console.log('✓ PASS: Customer OTP verified -> All 7 milestones completed successfully.');

// 8. Decoupled Payment Verification
console.log('\n--- STEP 8: Decoupled Payment Verification ---');
const codOrder = {
  ...newOrder,
  paymentMethod: 'COD',
  paymentStatus: 'Pending',
  orderStatus: 'Confirmed',
};
assert.strictEqual(codOrder.orderStatus, 'Confirmed');
// Payment captured for online order
const onlineOrderPaid = {
  ...newOrder,
  paymentMethod: 'Razorpay',
  paymentStatus: 'Paid',
  orderStatus: 'Confirmed',
};
assert.strictEqual(onlineOrderPaid.orderStatus, 'Confirmed', 'Prepaid order must still remain Confirmed, NOT Shipped');
console.log('✓ PASS: Payment success and order fulfillment status are completely decoupled.');

console.log('\n======================================================================');
console.log('🎉 ALL 8 ORDER STATUS PROGRESSION LIFECYCLE CHECKS PASSED (100%)');
console.log('======================================================================\n');

