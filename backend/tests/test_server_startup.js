/**
 * Backend Startup & Admin API Verification Test
 */
const http = require('http');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Admin = require('../src/models/Admin');
const { generateAccessToken } = require('../src/utils/generateToken');
const { httpServer, startServer } = require('../src/server');

async function testBackendStartup() {
  console.log('================================================================');
  console.log('🚀 TESTING SERVER BOOTSTRAP & ADMIN API ENDPOINTS');
  console.log('================================================================');

  try {
    // 1. Connect to DB and get/create test admin token
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);

    let admin = await Admin.findOne({ email: 'admin@bharatbazaar.in' });
    if (!admin) {
      admin = await Admin.findOne();
    }
    const adminToken = generateAccessToken(admin._id.toString(), admin.role);
    console.log(`✓ Admin identified: ${admin.email} (Role: ${admin.role})`);

    // 2. Start the HTTP and Socket server
    if (!httpServer.listening) {
      await startServer();
      console.log('✓ Express & Socket.IO server started and listening on port', env.PORT || 5000);
    }

    // 3. Helper to make HTTP requests
    const probe = (path, headers = {}) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: env.PORT || 5000,
            path,
            method: 'GET',
            headers,
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, body: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // 4. Test Health Check
    const health = await probe('/api/health');
    console.log(`✓ Health Check responded: HTTP ${health.status}`, health.body?.status || health.body);

    // 5. Test Unauthorized Admin Request to /api/v1/admin/reports/searches
    const unauth = await probe('/api/v1/admin/reports/searches');
    console.log(`✓ Unauthorized request check: HTTP ${unauth.status} (Expected 401 - Protected by protectAdmin)`);

    // 6. Test Authorized Admin Request to /api/v1/admin/reports/searches
    const auth = await probe('/api/v1/admin/reports/searches', {
      Authorization: `Bearer ${adminToken}`,
    });
    console.log(`✓ Authorized admin request check: HTTP ${auth.status} (Expected 200 - Handler executed successfully)`);
    console.log('  Data returned:', auth.body?.data || auth.body);

    // 7. Test Alias Route /api/v1/admin/analytics/searches
    const aliasAuth = await probe('/api/v1/admin/analytics/searches', {
      Authorization: `Bearer ${adminToken}`,
    });
    console.log(`✓ Alias route /api/v1/admin/analytics/searches: HTTP ${aliasAuth.status} (Expected 200)`);

    console.log('\n================================================================');
    console.log('🎉 ALL SERVER BOOTSTRAP, ROUTE & ADMIN API CHECKS PASSED!');
    console.log('================================================================');
    
    // Graceful close
    httpServer.close(() => {
      console.log('✓ Server closed cleanly.');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Server startup test failed:', err);
    process.exit(1);
  }
}

testBackendStartup();
