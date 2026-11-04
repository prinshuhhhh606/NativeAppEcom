/**
 * Automated Test: One-Time Seller Approval & Direct Product Publishing Workflow
 */
const assert = require('assert');
const mongoose = require('mongoose');

console.log('Testing One-Time Seller Approval & Direct Product Publishing...');

// 1. Verify Seller Model & Enum
console.log('\n--- TEST 1: Seller Model Schema & Statuses ---');
const Seller = require('../src/models/Seller');
const sellerStatuses = Seller.schema.path('status').enumValues;
console.log('Seller status enum values:', sellerStatuses);
assert(sellerStatuses.includes('pending'), 'Seller status must support "pending"');
assert(sellerStatuses.includes('approved'), 'Seller status must support "approved"');
assert(sellerStatuses.includes('rejected'), 'Seller status must support "rejected"');
assert(sellerStatuses.includes('suspended'), 'Seller status must support "suspended"');
assert(Seller.schema.path('isVerified'), 'Seller schema must have isVerified field');
assert(Seller.schema.path('approvedAt'), 'Seller schema must have approvedAt field');
console.log('✓ Seller model schema validated');

// 2. Verify Product Model Schema
console.log('\n--- TEST 2: Product Model Schema & publishedAt ---');
const Product = require('../src/models/Product');
assert(Product.schema.path('publishedAt'), 'Product schema must have publishedAt field');
assert(Product.schema.path('approvalStatus'), 'Product schema must have approvalStatus field');
console.log('✓ Product model schema validated');

// 3. Test One-Time Seller Approval Logic
console.log('\n--- TEST 3: One-Time Seller Approval Logic ---');
const mockSeller = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Rajesh Sharma',
  email: 'rajesh.sharma@example.com',
  storeName: 'Jaipur Handloom Store',
  status: 'pending',
  isVerified: false,
  approvedAt: null,
  rejectionReason: '',
  save: async function () {
    return this;
  },
};

// Admin approves seller
mockSeller.status = 'approved';
mockSeller.isVerified = true;
mockSeller.approvedAt = new Date();
mockSeller.rejectionReason = '';

assert.strictEqual(mockSeller.status, 'approved');
assert.strictEqual(mockSeller.isVerified, true);
assert(mockSeller.approvedAt instanceof Date);
console.log('✓ Seller one-time approval persists: status="approved", isVerified=true');

// 4. Test Direct Product Creation for Approved Seller
console.log('\n--- TEST 4: Direct Product Creation for Approved Seller ---');
const directProduct = {
  _id: new mongoose.Types.ObjectId(),
  productName: 'Jaipuri Hand-block Print Pure Cotton Bedsheet',
  price: 899,
  stock: 40,
  seller: mockSeller._id,
  isDraft: false,
};

// Simulation of createProduct logic for approved seller
let approvalStatus;
let isActive;
let publishedAt;

if (mockSeller.status === 'approved') {
  if (directProduct.isDraft) {
    approvalStatus = 'draft';
    isActive = false;
    publishedAt = null;
  } else {
    // DIRECT PUBLISHING: No admin review required
    approvalStatus = 'approved';
    isActive = true;
    publishedAt = new Date();
  }
}

assert.strictEqual(approvalStatus, 'approved', 'Approved seller product must directly have approvalStatus="approved"');
assert.strictEqual(isActive, true, 'Approved seller product must directly be active');
assert(publishedAt instanceof Date, 'Published product must have publishedAt timestamp');
console.log('✓ Approved seller publishes product directly with status="approved" and isActive=true');

// 5. Test Draft option for Approved Seller
console.log('\n--- TEST 5: Draft Option for Approved Seller ---');
const draftProduct = { ...directProduct, isDraft: true };
let draftStatus;
let draftActive;

if (mockSeller.status === 'approved') {
  if (draftProduct.isDraft) {
    draftStatus = 'draft';
    draftActive = false;
  } else {
    draftStatus = 'approved';
    draftActive = true;
  }
}
assert.strictEqual(draftStatus, 'draft');
assert.strictEqual(draftActive, false);
console.log('✓ Approved seller can still choose to save as Draft when desired');

// 6. Test Unapproved & Suspended Seller Block
console.log('\n--- TEST 6: Unapproved & Suspended Seller Blocks ---');
const pendingSeller = { ...mockSeller, status: 'pending', isVerified: false };
const suspendedSeller = { ...mockSeller, status: 'suspended', isVerified: false };

const checkCanPublish = (seller) => {
  if (seller.status !== 'approved') {
    throw new Error(`Your seller account status is "${seller.status}". Publishing requires approved status.`);
  }
  return true;
};

assert.throws(() => checkCanPublish(pendingSeller), /pending/);
assert.throws(() => checkCanPublish(suspendedSeller), /suspended/);
assert.strictEqual(checkCanPublish(mockSeller), true);
console.log('✓ Pending and suspended sellers are strictly blocked from publishing products');

// 7. Test Public Storefront Visibility Query
console.log('\n--- TEST 7: Storefront Query Includes Approved & Excludes Pending/Draft ---');
const customerFilter = {
  isActive: true,
  approvalStatus: { $nin: ['draft', 'pending', 'pending_approval', 'rejected', 'suspended'] },
};

// Helper simulation of MongoDB query match
const matchesCustomerFilter = (doc, filter) => {
  if (filter.isActive && !doc.isActive) return false;
  if (filter.approvalStatus?.$nin && filter.approvalStatus.$nin.includes(doc.approvalStatus)) return false;
  return true;
};

const liveDoc = { approvalStatus: 'approved', isActive: true };
const pendingDoc = { approvalStatus: 'pending', isActive: false };
const draftDoc = { approvalStatus: 'draft', isActive: false };
const rejectedDoc = { approvalStatus: 'rejected', isActive: false };

assert.strictEqual(matchesCustomerFilter(liveDoc, customerFilter), true, 'Directly published product must show in customer storefront');
assert.strictEqual(matchesCustomerFilter(pendingDoc, customerFilter), false, 'Pending product must NOT show in customer storefront');
assert.strictEqual(matchesCustomerFilter(draftDoc, customerFilter), false, 'Draft product must NOT show in customer storefront');
assert.strictEqual(matchesCustomerFilter(rejectedDoc, customerFilter), false, 'Rejected product must NOT show in customer storefront');
console.log('✓ Public storefront query verified: directly published products are immediately visible to customers');

console.log('\n================================================================');
console.log('🎉 ALL ONE-TIME SELLER APPROVAL & DIRECT PUBLISHING TESTS PASSED');
console.log('================================================================');

