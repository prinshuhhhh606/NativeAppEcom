/**
 * Integration Test: Seller Registration -> Admin Approval -> Seller Login Workflow
 *
 * Verifies:
 * 1. Seller registers without KYC documents -> assigned 'pending' status & requiresApproval.
 * 2. Unapproved seller login attempt is blocked with 403 "Your account is waiting for Admin approval."
 * 3. Admin can list pending sellers and approve.
 * 4. Approved seller logs in successfully and receives tokens.
 * 5. Approved seller accesses protected seller APIs.
 * 6. Admin can reject a seller with mandatory rejection reason -> seller login blocked with reason.
 * 7. Admin can suspend an approved seller -> login & protected APIs blocked with 403.
 */

const axios = require('axios');
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('\n======================================================');
  console.log('--- SELLER REGISTRATION & ADMIN APPROVAL WORKFLOW TEST ---');
  console.log('======================================================\n');

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
    const vendorEmail = `workflow_seller_${timestamp}@example.com`;
    const vendorPassword = 'Password@123';
    const vendorPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // --- STEP 1: Admin Login to perform approvals ---
    console.log('\n--- Step 1: Admin Login ---');
    const adminRes = await axios.post(`${API_URL}/admin/auth/login`, {
      email: 'admin@appecom.in',
      password: 'Admin@12345',
    });
    const adminToken = adminRes.data?.data?.accessToken || adminRes.data?.accessToken;
    assert(!!adminToken, 'Admin logged in and retrieved adminToken');

    // --- STEP 2: Seller Registration without KYC ---
    console.log('\n--- Step 2: Register New Seller without KYC ---');
    const regRes = await axios.post(`${API_URL}/seller/auth/register`, {
      name: 'Ramesh Patel',
      businessName: 'Patel Handlooms',
      email: vendorEmail,
      phone: vendorPhone,
      password: vendorPassword,
      confirmPassword: vendorPassword,
    });

    assert(regRes.status === 201, `Registration returned status 201 (Got: ${regRes.status})`);
    assert(regRes.data.status === 'pending', `Seller status is pending (Got: ${regRes.data.status})`);
    assert(regRes.data.requiresApproval === true, 'requiresApproval flag is true');
    assert(!regRes.data.accessToken && !regRes.data.token, 'No session tokens issued to pending seller');
    const newSellerId = regRes.data.seller?.id || regRes.data.seller?._id;
    assert(!!newSellerId, `Registered seller has ID: ${newSellerId}`);

    // --- STEP 3: Pending Seller attempts to Login before Approval ---
    console.log('\n--- Step 3: Pending Seller Login Attempt (Should be blocked) ---');
    try {
      await axios.post(`${API_URL}/seller/auth/login`, {
        email: vendorEmail,
        password: vendorPassword,
      });
      assert(false, 'Pending seller should NOT be allowed to login');
    } catch (err) {
      assert(err.response?.status === 403, `Login returned 403 Forbidden (Got: ${err.response?.status})`);
      assert(
        err.response?.data?.status === 'pending',
        `Error payload contains status: pending (Got: ${err.response?.data?.status})`
      );
      assert(
        err.response?.data?.message?.includes('waiting for Admin approval'),
        `Error message: "${err.response?.data?.message}"`
      );
    }

    // --- STEP 4: Admin Queries Pending Sellers ---
    console.log('\n--- Step 4: Admin Queries Pending Sellers ---');
    const pendingListRes = await axios.get(`${API_URL}/admin/sellers?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingSellers = pendingListRes.data?.data || pendingListRes.data?.sellers || [];
    const foundPending = pendingSellers.find((s) => s.email === vendorEmail);
    assert(!!foundPending, `Newly registered seller ${vendorEmail} found in pending list`);

    // --- STEP 5: Admin Approves the Seller ---
    console.log('\n--- Step 5: Admin Approves the Seller ---');
    const approveRes = await axios.patch(
      `${API_URL}/admin/sellers/${newSellerId}/status`,
      { status: 'approved' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(approveRes.status === 200, `Admin approval returned 200 (Got: ${approveRes.status})`);
    assert(approveRes.data.data?.status === 'approved', 'Seller status updated to approved in database');

    // --- STEP 6: Approved Seller Logs In Successfully ---
    console.log('\n--- Step 6: Approved Seller Logs In ---');
    const loginRes = await axios.post(`${API_URL}/seller/auth/login`, {
      email: vendorEmail,
      password: vendorPassword,
    });
    assert(loginRes.status === 200, `Login returned 200 OK (Got: ${loginRes.status})`);
    const sellerAccessToken =
      loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(!!sellerAccessToken, 'Approved seller received valid accessToken');
    assert(
      loginRes.data?.seller?.status === 'approved' ||
        loginRes.data?.data?.seller?.status === 'approved',
      'Seller payload confirms status is approved'
    );

    // --- STEP 7: Approved Seller Accesses Protected Seller API ---
    console.log('\n--- Step 7: Approved Seller Accesses Dashboard Overview ---');
    const overviewRes = await axios.get(`${API_URL}/seller/dashboard/overview`, {
      headers: { Authorization: `Bearer ${sellerAccessToken}` },
    });
    assert(overviewRes.status === 200, `Dashboard overview returned 200 OK (Got: ${overviewRes.status})`);

    // --- STEP 8: Reject Workflow with Mandatory Reason ---
    console.log('\n--- Step 8: Reject Workflow with Reason ---');
    const rejectEmail = `reject_test_${timestamp}@example.com`;
    const regRejectRes = await axios.post(`${API_URL}/seller/auth/register`, {
      name: 'Reject Test User',
      businessName: 'Reject Store',
      email: rejectEmail,
      phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: vendorPassword,
      confirmPassword: vendorPassword,
    });
    const rejectSellerId = regRejectRes.data.seller?.id || regRejectRes.data.seller?._id;

    // Admin rejects seller with custom reason
    const customReason = 'Business details do not meet marketplace guidelines.';
    const rejectRes = await axios.patch(
      `${API_URL}/admin/sellers/${rejectSellerId}/status`,
      { status: 'rejected', rejectionReason: customReason },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(rejectRes.status === 200, 'Admin rejection returned 200 OK');

    // Rejected seller attempts login
    try {
      await axios.post(`${API_URL}/seller/auth/login`, {
        email: rejectEmail,
        password: vendorPassword,
      });
      assert(false, 'Rejected seller should NOT be allowed to login');
    } catch (err) {
      assert(err.response?.status === 403, `Rejected login returned 403 (Got: ${err.response?.status})`);
      assert(
        err.response?.data?.status === 'rejected',
        `Payload status is rejected (Got: ${err.response?.data?.status})`
      );
      assert(
        err.response?.data?.message?.includes(customReason),
        `Error message displays rejection reason: "${err.response?.data?.message}"`
      );
    }

    // --- STEP 9: Suspend Workflow ---
    console.log('\n--- Step 9: Suspend Workflow ---');
    // Admin suspends the first approved seller
    const suspendRes = await axios.patch(
      `${API_URL}/admin/sellers/${newSellerId}/status`,
      { status: 'suspended' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(suspendRes.status === 200, 'Admin suspension returned 200 OK');

    // Suspended seller attempts login
    try {
      await axios.post(`${API_URL}/seller/auth/login`, {
        email: vendorEmail,
        password: vendorPassword,
      });
      assert(false, 'Suspended seller should NOT be allowed to login');
    } catch (err) {
      assert(err.response?.status === 403, `Suspended login returned 403 (Got: ${err.response?.status})`);
      assert(
        err.response?.data?.status === 'suspended',
        `Payload status is suspended (Got: ${err.response?.data?.status})`
      );
    }

    // Suspended seller attempts protected API with old token
    try {
      await axios.get(`${API_URL}/seller/dashboard/overview`, {
        headers: { Authorization: `Bearer ${sellerAccessToken}` },
      });
      assert(false, 'Suspended seller token should NOT be able to access protected API');
    } catch (err) {
      assert(err.response?.status === 403, `Suspended API call returned 403 (Got: ${err.response?.status})`);
    }

    console.log('\n======================================================');
    console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
    console.log('======================================================\n');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal error running workflow test:', globalErr.response?.data || globalErr.message);
    process.exit(1);
  }
}

runTest();
