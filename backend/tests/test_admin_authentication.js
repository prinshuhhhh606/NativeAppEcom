/**
 * Comprehensive Automated Test: Admin Authentication & Security Verification
 * Tests all 8 required cases from Requirement 6:
 * 1. Admin login with correct credentials.
 * 2. Admin login with incorrect credentials.
 * 3. Access dashboard without token.
 * 4. Access dashboard with valid admin token.
 * 5. Access dashboard with expired token.
 * 6. Access admin API with customer token.
 * 7. Access admin API with seller token.
 * 8. Logout and token cleanup.
 */
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const env = require('../src/config/env');
const Admin = require('../src/models/Admin');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const { app } = require('../src/server');
const { generateAccessToken } = require('../src/utils/generateToken');

// Simple HTTP request helper
function makeRequest(server, options, postData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAdminAuthTestSuite() {
  console.log('======================================================================');
  console.log('🧪 Starting Comprehensive Admin Authentication & RBAC Security Tests');
  console.log('======================================================================');

  let server;
  try {
    // Connect to MongoDB
    console.log(`\nConnecting to MongoDB: ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✓ Connected to DB: ${mongoose.connection.host}/${mongoose.connection.name}`);

    // Start ephemeral server on random port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    console.log(`✓ Test HTTP server listening on port ${port}`);

    // Seed/Ensure Admin User
    let admin = await Admin.findOne({ email: 'admin@appecom.in' }).select('+password');
    if (!admin) {
      console.log('Creating demo Super Admin...');
      admin = await Admin.create({
        name: 'Super Admin',
        email: 'admin@appecom.in',
        password: 'Admin@12345',
        phone: '9876543210',
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
      });
      admin = await Admin.findOne({ email: 'admin@appecom.in' }).select('+password');
    }
    console.log(`✓ Admin user verified: ${admin.email} (Role: ${admin.role})`);

    // Seed/Ensure Customer User
    let customer = await User.findOne({ email: 'customer_test_auth@appecom.in' });
    if (!customer) {
      customer = await User.create({
        fullName: 'Test Customer',
        name: 'Test Customer',
        email: 'customer_test_auth@appecom.in',
        phone: '9811122233',
        mobileNumber: '9811122233',
        password: 'Password@123',
        role: 'customer',
      });
    }
    console.log(`✓ Customer user verified: ${customer.email} (Role: ${customer.role})`);

    // Seed/Ensure Seller User
    let seller = await Seller.findOne({ email: 'seller_test_auth@appecom.in' });
    if (!seller) {
      seller = await Seller.create({
        name: 'Test Seller',
        email: 'seller_test_auth@appecom.in',
        phone: '9844455566',
        password: 'Seller@12345',
        businessName: 'Auth Test Sellers Pvt Ltd',
        storeName: 'Auth Test Store',
        status: 'approved',
        isActive: true,
        isVerified: true,
      });
    }
    console.log(`✓ Seller user verified: ${seller.email}`);

    // =========================================================================
    // CASE 1: Admin login with correct credentials
    // =========================================================================
    console.log('\n[Case 1] Admin login with correct credentials:');
    const loginRes = await makeRequest(server, {
      path: '/api/v1/admin/auth/login',
      method: 'POST',
    }, {
      email: 'admin@appecom.in',
      password: 'Admin@12345',
    });

    console.log(`  Status: ${loginRes.statusCode}`);
    console.log(`  Response Message: ${loginRes.body?.message}`);
    const adminToken = loginRes.body?.data?.accessToken || loginRes.body?.data?.token;
    const adminRefreshToken = loginRes.body?.data?.refreshToken;

    if (loginRes.statusCode !== 200 || !adminToken) {
      throw new Error(`Case 1 FAILED: Expected 200 OK with accessToken, got status ${loginRes.statusCode}`);
    }
    console.log(`  ✓ Token generated: ${adminToken.slice(0, 30)}...`);
    console.log('  ✓ Case 1 PASSED: Admin authenticated successfully.');

    // =========================================================================
    // CASE 2: Admin login with incorrect credentials
    // =========================================================================
    console.log('\n[Case 2] Admin login with incorrect credentials:');
    const invalidLoginRes = await makeRequest(server, {
      path: '/api/v1/admin/auth/login',
      method: 'POST',
    }, {
      email: 'admin@appecom.in',
      password: 'WrongPassword999!',
    });

    console.log(`  Status: ${invalidLoginRes.statusCode}`);
    console.log(`  Response Message: ${invalidLoginRes.body?.message || invalidLoginRes.body?.error}`);
    if (invalidLoginRes.statusCode !== 401) {
      throw new Error(`Case 2 FAILED: Expected 401 Unauthorized, got status ${invalidLoginRes.statusCode}`);
    }
    console.log('  ✓ Case 2 PASSED: Rejected incorrect admin password with 401 Unauthorized.');

    // =========================================================================
    // CASE 3: Access dashboard without token
    // =========================================================================
    console.log('\n[Case 3] Access dashboard without token:');
    const noTokenRes = await makeRequest(server, {
      path: '/api/v1/admin/dashboard',
      method: 'GET',
    });

    console.log(`  Status: ${noTokenRes.statusCode}`);
    console.log(`  Response: ${JSON.stringify(noTokenRes.body)}`);
    if (noTokenRes.statusCode !== 401) {
      throw new Error(`Case 3 FAILED: Expected 401 Unauthorized, got status ${noTokenRes.statusCode}`);
    }
    const msg3 = noTokenRes.body?.message || noTokenRes.body?.error;
    if (!msg3 || !msg3.toLowerCase().includes('no admin token')) {
      throw new Error(`Case 3 FAILED: Expected message to mention 'no admin token', got: ${msg3}`);
    }
    console.log('  ✓ Case 3 PASSED: Returned 401 "Authentication required: no admin token provided".');

    // =========================================================================
    // CASE 4: Access dashboard with valid admin token
    // =========================================================================
    console.log('\n[Case 4] Access dashboard with valid admin token:');
    const validDashboardRes = await makeRequest(server, {
      path: '/api/v1/admin/dashboard',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    console.log(`  Status: ${validDashboardRes.statusCode}`);
    console.log(`  Data overview keys: ${Object.keys(validDashboardRes.body?.data?.overview || {}).join(', ')}`);
    if (validDashboardRes.statusCode !== 200) {
      throw new Error(`Case 4 FAILED: Expected 200 OK, got status ${validDashboardRes.statusCode}`);
    }
    console.log('  ✓ Case 4 PASSED: Authorized admin dashboard access with 200 OK.');

    // =========================================================================
    // CASE 5: Access dashboard with expired token
    // =========================================================================
    console.log('\n[Case 5] Access dashboard with expired token:');
    // Generate intentionally expired JWT token
    const expiredToken = jwt.sign(
      { id: admin._id, role: admin.role },
      env.JWT.ACCESS_SECRET,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );

    const expiredRes = await makeRequest(server, {
      path: '/api/v1/admin/dashboard',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${expiredToken}`,
      },
    });

    console.log(`  Status: ${expiredRes.statusCode}`);
    console.log(`  Response Message: ${expiredRes.body?.message || expiredRes.body?.error}`);
    if (expiredRes.statusCode !== 401) {
      throw new Error(`Case 5 FAILED: Expected 401 for expired token, got status ${expiredRes.statusCode}`);
    }
    console.log('  ✓ Case 5 PASSED: Expired admin token rejected with 401 Unauthorized.');

    // =========================================================================
    // CASE 6: Access admin API with customer token
    // =========================================================================
    console.log('\n[Case 6] Access admin API with customer token:');
    const customerToken = generateAccessToken(customer._id, 'customer');

    const customerAccessRes = await makeRequest(server, {
      path: '/api/v1/admin/dashboard',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });

    console.log(`  Status: ${customerAccessRes.statusCode}`);
    console.log(`  Response Message: ${customerAccessRes.body?.message || customerAccessRes.body?.error}`);
    if (customerAccessRes.statusCode !== 403) {
      throw new Error(`Case 6 FAILED: Expected 403 Forbidden for customer role, got status ${customerAccessRes.statusCode}`);
    }
    console.log('  ✓ Case 6 PASSED: Customer access to admin API blocked with 403 Forbidden.');

    // =========================================================================
    // CASE 7: Access admin API with seller token
    // =========================================================================
    console.log('\n[Case 7] Access admin API with seller token:');
    const sellerToken = generateAccessToken(seller._id, 'seller');

    const sellerAccessRes = await makeRequest(server, {
      path: '/api/v1/admin/dashboard',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
    });

    console.log(`  Status: ${sellerAccessRes.statusCode}`);
    console.log(`  Response Message: ${sellerAccessRes.body?.message || sellerAccessRes.body?.error}`);
    if (sellerAccessRes.statusCode !== 403) {
      throw new Error(`Case 7 FAILED: Expected 403 Forbidden for seller role, got status ${sellerAccessRes.statusCode}`);
    }
    console.log('  ✓ Case 7 PASSED: Seller access to admin API blocked with 403 Forbidden.');

    // =========================================================================
    // CASE 8: Logout and token cleanup
    // =========================================================================
    console.log('\n[Case 8] Logout and token cleanup:');
    const logoutRes = await makeRequest(server, {
      path: '/api/v1/admin/auth/logout',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    console.log(`  Status: ${logoutRes.statusCode}`);
    console.log(`  Response: ${JSON.stringify(logoutRes.body)}`);
    if (logoutRes.statusCode !== 200) {
      throw new Error(`Case 8 FAILED: Expected 200 OK on logout, got status ${logoutRes.statusCode}`);
    }

    // Verify DB refreshToken is wiped
    const updatedAdmin = await Admin.findById(admin._id).select('+refreshToken');
    const tokenCleaned = !updatedAdmin.refreshToken;
    console.log(`  ✓ Database refreshToken cleared: ${tokenCleaned}`);
    if (!tokenCleaned) {
      throw new Error('Case 8 FAILED: DB refresh token was not cleared upon logout');
    }
    console.log('  ✓ Case 8 PASSED: Admin successfully logged out and session revoked.');

    console.log('\n======================================================================');
    console.log('🎉 ALL 8 ADMIN AUTHENTICATION & SECURITY TEST CASES PASSED!');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runAdminAuthTestSuite();
}

module.exports = runAdminAuthTestSuite;

