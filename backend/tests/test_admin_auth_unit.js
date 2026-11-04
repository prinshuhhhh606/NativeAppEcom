/**
 * Unit Test Suite: Admin Authentication & RBAC Middleware
 * Tests all 8 required cases from Requirement 6 without external network dependencies:
 * 1. Admin login with correct credentials.
 * 2. Admin login with incorrect credentials.
 * 3. Access dashboard without token.
 * 4. Access dashboard with valid admin token.
 * 5. Access dashboard with expired token.
 * 6. Access admin API with customer token.
 * 7. Access admin API with seller token.
 * 8. Logout and token cleanup.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Models & Middleware
const Admin = require('../src/models/Admin');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const { protectAdmin } = require('../src/middleware/adminAuthMiddleware');
const adminAuthController = require('../src/controllers/admin/adminAuthController');
const { generateAccessToken, generateRefreshToken } = require('../src/utils/generateToken');
const env = require('../src/config/env');

// Mock response helper
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

async function runUnitTests() {
  console.log('======================================================================');
  console.log('🧪 Starting Admin Authentication Unit & RBAC Test Suite (8 Cases)');
  console.log('======================================================================\n');

  const adminId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const sellerId = new mongoose.Types.ObjectId();
  const rawPassword = 'Admin@12345';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const mockAdminRecord = {
    _id: adminId,
    name: 'Super Admin',
    email: 'admin@appecom.in',
    password: hashedPassword,
    role: 'super_admin',
    isActive: true,
    permissions: ['*'],
    refreshToken: 'valid-refresh-token',
    comparePassword: async function (candidate) {
      return bcrypt.compare(candidate, this.password);
    },
    save: async function () {
      return this;
    },
  };

  // =========================================================================
  // CASE 1: Admin login with correct credentials
  // =========================================================================
  console.log('[Case 1] Admin login with correct credentials:');
  const origFindOne = Admin.findOne;
  Admin.findOne = () => ({
    select: () => Promise.resolve(mockAdminRecord),
  });

  const req1 = {
    body: {
      email: 'admin@appecom.in',
      password: 'Admin@12345',
    },
    ip: '127.0.0.1',
  };
  const res1 = createMockRes();

  await adminAuthController.login(req1, res1);
  console.log(`  Status: ${res1.statusCode}`);
  console.log(`  Success: ${res1.body?.success}, Message: "${res1.body?.message}"`);
  console.log(`  AccessToken returned: ${Boolean(res1.body?.data?.accessToken)}`);
  console.log(`  RefreshToken returned: ${Boolean(res1.body?.data?.refreshToken)}`);

  if (res1.statusCode !== 200 || !res1.body?.data?.accessToken) {
    throw new Error(`Case 1 FAILED: Expected 200 OK with token, got ${res1.statusCode}`);
  }
  const validAdminToken = res1.body.data.accessToken;
  console.log('  ✓ Case 1 PASSED: Admin login successful with valid JWT.\n');

  // =========================================================================
  // CASE 2: Admin login with incorrect credentials
  // =========================================================================
  console.log('[Case 2] Admin login with incorrect credentials:');
  const req2 = {
    body: {
      email: 'admin@appecom.in',
      password: 'WrongPassword999',
    },
    ip: '127.0.0.1',
  };
  const res2 = createMockRes();

  await adminAuthController.login(req2, res2);
  console.log(`  Status: ${res2.statusCode}`);
  console.log(`  Message: "${res2.body?.message}"`);

  if (res2.statusCode !== 401) {
    throw new Error(`Case 2 FAILED: Expected 401 Unauthorized, got ${res2.statusCode}`);
  }
  console.log('  ✓ Case 2 PASSED: Rejected incorrect password with 401.\n');

  // Restore Admin.findOne
  Admin.findOne = origFindOne;

  // Mock Admin.findById for middleware tests
  const origFindById = Admin.findById;
  Admin.findById = (id) => {
    if (id && id.toString() === adminId.toString()) {
      return {
        ...mockAdminRecord,
        select: (field) => Promise.resolve(mockAdminRecord),
      };
    }
    return {
      select: () => Promise.resolve(null),
      then: (fn) => fn(null),
    };
  };

  // =========================================================================
  // CASE 3: Access dashboard without token
  // =========================================================================
  console.log('[Case 3] Access dashboard without token:');
  const req3 = {
    headers: {},
  };
  const res3 = createMockRes();
  let nextCalled3 = false;

  await protectAdmin(req3, res3, () => {
    nextCalled3 = true;
  });

  console.log(`  Status: ${res3.statusCode}`);
  console.log(`  Message: "${res3.body?.message}"`);

  if (res3.statusCode !== 401 || nextCalled3) {
    throw new Error(`Case 3 FAILED: Expected 401 Unauthorized, got ${res3.statusCode}`);
  }
  if (!res3.body?.message?.includes('no admin token provided')) {
    throw new Error(`Case 3 FAILED: Expected 'no admin token provided' in message`);
  }
  console.log('  ✓ Case 3 PASSED: Access blocked with 401 "Authentication required: no admin token provided".\n');

  // =========================================================================
  // CASE 4: Access dashboard with valid admin token
  // =========================================================================
  console.log('[Case 4] Access dashboard with valid admin token:');
  const req4 = {
    headers: {
      authorization: `Bearer ${validAdminToken}`,
    },
  };
  const res4 = createMockRes();
  let nextCalled4 = false;

  await protectAdmin(req4, res4, () => {
    nextCalled4 = true;
  });

  console.log(`  next() called: ${nextCalled4}`);
  console.log(`  req.admin attached: ${req4.admin?.email} (Role: ${req4.admin?.role})`);

  if (!nextCalled4 || !req4.admin) {
    throw new Error('Case 4 FAILED: Expected next() to be called with req.admin attached');
  }
  console.log('  ✓ Case 4 PASSED: Authorized request allowed to proceed (HTTP 200).\n');

  // =========================================================================
  // CASE 5: Access dashboard with expired token
  // =========================================================================
  console.log('[Case 5] Access dashboard with expired token:');
  const expiredToken = jwt.sign(
    { id: adminId, role: 'super_admin' },
    env.JWT.ACCESS_SECRET,
    { expiresIn: '-5s' }
  );

  const req5 = {
    headers: {
      authorization: `Bearer ${expiredToken}`,
    },
  };
  const res5 = createMockRes();
  let nextCalled5 = false;

  await protectAdmin(req5, res5, () => {
    nextCalled5 = true;
  });

  console.log(`  Status: ${res5.statusCode}`);
  console.log(`  Message: "${res5.body?.message}"`);

  if (res5.statusCode !== 401 || nextCalled5) {
    throw new Error(`Case 5 FAILED: Expected 401 for expired token, got ${res5.statusCode}`);
  }
  console.log('  ✓ Case 5 PASSED: Expired token rejected with 401.\n');

  // =========================================================================
  // CASE 6: Access admin API with customer token
  // =========================================================================
  console.log('[Case 6] Access admin API with customer token:');
  const customerToken = generateAccessToken(customerId, 'customer');

  const req6 = {
    headers: {
      authorization: `Bearer ${customerToken}`,
    },
  };
  const res6 = createMockRes();
  let nextCalled6 = false;

  await protectAdmin(req6, res6, () => {
    nextCalled6 = true;
  });

  console.log(`  Status: ${res6.statusCode}`);
  console.log(`  Message: "${res6.body?.message}"`);

  if (res6.statusCode !== 403 || nextCalled6) {
    throw new Error(`Case 6 FAILED: Expected 403 Forbidden for customer role, got ${res6.statusCode}`);
  }
  console.log('  ✓ Case 6 PASSED: Customer access rejected with 403 Forbidden.\n');

  // =========================================================================
  // CASE 7: Access admin API with seller token
  // =========================================================================
  console.log('[Case 7] Access admin API with seller token:');
  const sellerToken = generateAccessToken(sellerId, 'seller');

  const req7 = {
    headers: {
      authorization: `Bearer ${sellerToken}`,
    },
  };
  const res7 = createMockRes();
  let nextCalled7 = false;

  await protectAdmin(req7, res7, () => {
    nextCalled7 = true;
  });

  console.log(`  Status: ${res7.statusCode}`);
  console.log(`  Message: "${res7.body?.message}"`);

  if (res7.statusCode !== 403 || nextCalled7) {
    throw new Error(`Case 7 FAILED: Expected 403 Forbidden for seller role, got ${res7.statusCode}`);
  }
  console.log('  ✓ Case 7 PASSED: Seller access rejected with 403 Forbidden.\n');

  // =========================================================================
  // CASE 8: Logout and token cleanup
  // =========================================================================
  console.log('[Case 8] Logout and token cleanup:');
  let savedRefreshToken = 'active-token';
  const adminForLogout = {
    _id: adminId,
    name: 'Super Admin',
    email: 'admin@appecom.in',
    role: 'super_admin',
    refreshToken: savedRefreshToken,
    save: async function () {
      savedRefreshToken = this.refreshToken;
      return this;
    },
  };

  Admin.findById = () => ({
    select: () => Promise.resolve(adminForLogout),
  });

  const req8 = {
    admin: adminForLogout,
    ip: '127.0.0.1',
  };
  const res8 = createMockRes();

  await adminAuthController.logout(req8, res8);
  console.log(`  Status: ${res8.statusCode}`);
  console.log(`  Message: "${res8.body?.message}"`);
  console.log(`  Cleared DB refreshToken: ${adminForLogout.refreshToken === undefined}`);

  if (res8.statusCode !== 200 || adminForLogout.refreshToken !== undefined) {
    throw new Error(`Case 8 FAILED: Expected 200 OK and cleared refreshToken, got status ${res8.statusCode}`);
  }
  console.log('  ✓ Case 8 PASSED: Admin logout successful & refresh token invalidated.\n');

  // Restore mocks
  Admin.findById = origFindById;

  console.log('======================================================================');
  console.log('🎉 ALL 8 REQUIRED ADMIN AUTHENTICATION CASES VERIFIED & PASSED!');
  console.log('======================================================================');
}

runUnitTests().catch((e) => {
  console.error('Test Suite Failed:', e);
  process.exit(1);
});

