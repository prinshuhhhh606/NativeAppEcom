/**
 * Verification Test:
 * 1. Seller registers (status: 'pending')
 * 2. Unapproved seller cannot log in (blocked with 403)
 * 3. Admin approves seller
 * 4. Seller logs in for the FIRST TIME successfully (HTTP 200)
 * 5. Seller accesses Dashboard with issued tokens
 */

const axios = require('axios');
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('\n================================================================');
  console.log('--- TEST: SELLER REGISTRATION -> ADMIN APPROVAL -> FIRST LOGIN ---');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const sellerEmail = `firstlogin_seller_${timestamp}@example.com`;
    const sellerPassword = 'SellerPassword@123';
    const sellerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Admin login to get admin authorization
    console.log('1. Admin logging in...');
    const adminLoginRes = await axios.post(`${API_URL}/admin/auth/login`, {
      email: 'admin@appecom.in',
      password: 'Admin@12345',
    });
    const adminToken = adminLoginRes.data?.data?.accessToken || adminLoginRes.data?.accessToken;
    assert(!!adminToken, 'Admin logged in and retrieved adminToken');

    // 2. New Seller Registration (No KYC)
    console.log('\n2. New Seller registering without KYC documents...');
    const registerRes = await axios.post(`${API_URL}/seller/auth/register`, {
      name: 'Pooja Verma',
      businessName: 'Verma Handcrafts',
      email: sellerEmail,
      phone: sellerPhone,
      password: sellerPassword,
      confirmPassword: sellerPassword,
    });

    assert(registerRes.status === 201, `Registration returned status 201 (Got: ${registerRes.status})`);
    assert(registerRes.data.status === 'pending', 'Seller status set to pending');
    assert(registerRes.data.requiresApproval === true, 'requiresApproval flag is true');
    assert(!registerRes.data.accessToken, 'No session token issued before Admin approval');
    const sellerId = registerRes.data.seller?.id || registerRes.data.seller?._id;
    assert(!!sellerId, `Seller ID generated: ${sellerId}`);

    // 3. Seller attempts login BEFORE Admin approval
    console.log('\n3. Seller attempting login BEFORE Admin approval...');
    try {
      await axios.post(`${API_URL}/seller/auth/login`, {
        email: sellerEmail,
        password: sellerPassword,
      });
      assert(false, 'Unapproved seller should NOT be able to log in');
    } catch (err) {
      assert(err.response?.status === 403, `Login blocked with 403 Forbidden (Got: ${err.response?.status})`);
      assert(
        err.response?.data?.message?.includes('waiting for Admin approval'),
        `Message: "${err.response?.data?.message}"`
      );
    }

    // 4. Admin reviews pending sellers and Approves
    console.log('\n4. Admin reviewing pending sellers list and approving seller...');
    const pendingListRes = await axios.get(`${API_URL}/admin/sellers?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const list = pendingListRes.data?.data || pendingListRes.data?.sellers || [];
    const found = list.find((s) => s.email === sellerEmail);
    assert(!!found, `Registered seller ${sellerEmail} found in Admin pending queue`);

    // Admin approves seller
    const approveRes = await axios.patch(
      `${API_URL}/admin/sellers/${sellerId}/status`,
      { status: 'approved' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(approveRes.status === 200, `Admin approval returned 200 OK (Got: ${approveRes.status})`);
    assert(approveRes.data.data?.status === 'approved', 'Seller status is now "approved" in database');

    // 5. Seller logs in for the FIRST TIME!
    console.log('\n5. Seller logging in for the FIRST TIME after Admin approval...');
    const firstLoginRes = await axios.post(`${API_URL}/seller/auth/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });

    assert(firstLoginRes.status === 200, `First-time login succeeded with status 200 OK! (Got: ${firstLoginRes.status})`);
    const sellerAccessToken =
      firstLoginRes.data?.accessToken || firstLoginRes.data?.data?.accessToken;
    assert(!!sellerAccessToken, 'First-time login issued valid accessToken');
    const loggedSellerStatus =
      firstLoginRes.data?.seller?.status || firstLoginRes.data?.data?.seller?.status;
    assert(loggedSellerStatus === 'approved', `Seller status confirmed as approved (${loggedSellerStatus})`);

    // 6. First-time logged in seller accesses Dashboard Overview
    console.log('\n6. Approved seller accessing Dashboard Overview with new access token...');
    const dashboardRes = await axios.get(`${API_URL}/seller/dashboard/overview`, {
      headers: { Authorization: `Bearer ${sellerAccessToken}` },
    });
    assert(dashboardRes.status === 200, `Dashboard overview returned 200 OK! (Got: ${dashboardRes.status})`);
    assert(dashboardRes.data.success === true, 'Dashboard data returned successfully');

    console.log('\n================================================================');
    console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
    console.log('================================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();

