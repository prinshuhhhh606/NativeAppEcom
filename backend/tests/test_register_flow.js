/**
 * Test Customer Registration & Authentication Flow
 */
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const { register, login } = require('../src/controllers/authController');

// Mock Express response generator
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
  };
  return res;
};

const callController = (handler, req) => {
  return new Promise((resolve) => {
    const res = createMockRes();
    res.json = (payload) => {
      res.data = payload;
      resolve(res);
      return res;
    };
    const next = (err) => {
      res.error = err;
      resolve(res);
    };
    handler(req, res, next);
  });
};

async function runTests() {
  console.log('--- Starting User Registration & Login Test Suite ---');
  await connectDB();

  const testMobile = '9912345678';
  const testEmail = 'testuser.regflow@appecom.in';
  const testPassword = 'Password@12345';

  // Cleanup any leftover test data
  await User.deleteMany({
    $or: [{ email: testEmail }, { mobileNumber: testMobile }],
  });

  // Test 1: Missing Full Name
  console.log('\n[Test 1] Missing Full Name');
  {
    const req = {
      body: {
        mobileNumber: testMobile,
        email: testEmail,
        password: testPassword,
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message || res.error?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('Full name')) {
      throw new Error('Test 1 Failed: Expected 400 with Full name required');
    }
    console.log('✓ PASS: Caught missing Full Name');
  }

  // Test 2: Missing Mobile Number
  console.log('\n[Test 2] Missing Mobile Number');
  {
    const req = {
      body: {
        fullName: 'Test User',
        email: testEmail,
        password: testPassword,
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message || res.error?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('mobile number')) {
      throw new Error('Test 2 Failed: Expected 400 with Mobile number required');
    }
    console.log('✓ PASS: Caught missing Mobile Number');
  }

  // Test 3: Invalid Mobile Number
  console.log('\n[Test 3] Invalid Mobile Number (too short / invalid prefix)');
  {
    const req = {
      body: {
        fullName: 'Test User',
        mobileNumber: '12345',
        email: testEmail,
        password: testPassword,
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message || res.error?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('valid 10-digit Indian mobile number')) {
      throw new Error('Test 3 Failed: Expected 400 for invalid mobile format');
    }
    console.log('✓ PASS: Caught invalid Mobile Number');
  }

  // Test 4: Missing Email
  console.log('\n[Test 4] Missing / Invalid Email');
  {
    const req = {
      body: {
        fullName: 'Test User',
        mobileNumber: testMobile,
        email: 'invalid-email',
        password: testPassword,
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message || res.error?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('email address')) {
      throw new Error('Test 4 Failed: Expected 400 for invalid email');
    }
    console.log('✓ PASS: Caught invalid Email');
  }

  // Test 5: Missing / Short Password
  console.log('\n[Test 5] Password too short');
  {
    const req = {
      body: {
        fullName: 'Test User',
        mobileNumber: testMobile,
        email: testEmail,
        password: '123',
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message || res.error?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('Password')) {
      throw new Error('Test 5 Failed: Expected 400 for short password');
    }
    console.log('✓ PASS: Caught short Password');
  }

  // Test 6: Successful Registration with Canonical & Alias Payload
  console.log('\n[Test 6] Successful User Registration');
  let registeredUserId = null;
  {
    const req = {
      body: {
        fullName: 'Aarav Sharma',
        mobileNumber: testMobile,
        email: testEmail,
        password: testPassword,
      },
    };
    const res = await callController(register, req);
    if (res.error) {
      console.error('Error in Test 6:', res.error);
    }
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 201 || !res.data?.success) {
      throw new Error(`Test 6 Failed: Registration failed with status ${res.statusCode}, error: ${res.error?.message || JSON.stringify(res.data)}`);
    }

    registeredUserId = res.data.data.user.id || res.data.data.user._id;
    const userInDb = await User.findById(registeredUserId).select('+passwordHash');
    if (!userInDb) {
      throw new Error('Test 6 Failed: User not found in MongoDB');
    }

    console.log(`User created in DB: id=${userInDb._id}`);
    console.log(`  fullName: "${userInDb.fullName}"`);
    console.log(`  mobileNumber: "${userInDb.mobileNumber}"`);
    console.log(`  email: "${userInDb.email}"`);
    console.log(`  role: "${userInDb.role}"`);
    console.log(`  passwordHash: "${userInDb.passwordHash.substring(0, 15)}..." (hashed with bcrypt)`);
    console.log(`  virtual name: "${userInDb.name}"`);
    console.log(`  virtual phone: "${userInDb.phone}"`);

    if (userInDb.fullName !== 'Aarav Sharma') throw new Error('fullName mismatch in MongoDB');
    if (userInDb.mobileNumber !== testMobile) throw new Error('mobileNumber mismatch in MongoDB');
    if (userInDb.email !== testEmail) throw new Error('email mismatch in MongoDB');
    if (!userInDb.passwordHash.startsWith('$2')) throw new Error('password not hashed with bcrypt');

    // Verify Cart and Wishlist created
    const cart = await Cart.findOne({ user: userInDb._id });
    const wishlist = await Wishlist.findOne({ user: userInDb._id });
    if (!cart) throw new Error('Cart was not initialized for user');
    if (!wishlist) throw new Error('Wishlist was not initialized for user');
    console.log('✓ PASS: User, Cart, and Wishlist successfully created and stored in MongoDB');
  }

  // Test 7: Duplicate Email
  console.log('\n[Test 7] Duplicate Email Prevention');
  {
    const req = {
      body: {
        fullName: 'Another User',
        mobileNumber: '9988776655',
        email: testEmail, // same email
        password: 'AnotherPassword@123',
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('Email address is already registered')) {
      throw new Error('Test 7 Failed: Duplicate email was not blocked');
    }
    console.log('✓ PASS: Duplicate Email blocked with proper message');
  }

  // Test 8: Duplicate Mobile Number
  console.log('\n[Test 8] Duplicate Mobile Number Prevention');
  {
    const req = {
      body: {
        fullName: 'Another User',
        mobileNumber: testMobile, // same mobile
        email: 'different.email@appecom.in',
        password: 'AnotherPassword@123',
      },
    };
    const res = await callController(register, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 400 || !res.data?.message?.includes('Mobile number is already registered')) {
      throw new Error('Test 8 Failed: Duplicate mobile number was not blocked');
    }
    console.log('✓ PASS: Duplicate Mobile Number blocked with proper message');
  }

  // Test 9: Login with Email & Password
  console.log('\n[Test 9] Login with Email & Password');
  {
    const req = {
      body: {
        email: testEmail,
        password: testPassword,
      },
    };
    const res = await callController(login, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 200 || !res.data?.data?.accessToken) {
      throw new Error('Test 9 Failed: Email login failed');
    }
    console.log(`✓ PASS: Logged in successfully with Email (token=${res.data.data.accessToken.substring(0, 15)}...)`);
  }

  // Test 10: Login with Mobile Number & Password
  console.log('\n[Test 10] Login with Mobile Number & Password');
  {
    const req = {
      body: {
        identifier: testMobile,
        password: testPassword,
      },
    };
    const res = await callController(login, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 200 || !res.data?.data?.accessToken) {
      throw new Error('Test 10 Failed: Mobile number login failed');
    }
    console.log(`✓ PASS: Logged in successfully with Mobile Number`);
  }

  // Test 11: Login with Wrong Password
  console.log('\n[Test 11] Login with Incorrect Password');
  {
    const req = {
      body: {
        email: testEmail,
        password: 'WrongPassword@999',
      },
    };
    const res = await callController(login, req);
    console.log(`Status: ${res.statusCode}, Message: ${res.data?.message}`);
    if (res.statusCode !== 401) {
      throw new Error('Test 11 Failed: Incorrect password did not return 401');
    }
    console.log('✓ PASS: Incorrect Password rejected with 401');
  }

  // Cleanup
  console.log('\n--- Cleaning up test records ---');
  await User.deleteMany({
    $or: [{ email: testEmail }, { mobileNumber: testMobile }],
  });
  if (registeredUserId) {
    await Cart.deleteMany({ user: registeredUserId });
    await Wishlist.deleteMany({ user: registeredUserId });
  }
  console.log('✓ Test records cleaned up');

  console.log('\n=============================================');
  console.log('ALL REGISTRATION & AUTHENTICATION TESTS PASSED!');
  console.log('=============================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
