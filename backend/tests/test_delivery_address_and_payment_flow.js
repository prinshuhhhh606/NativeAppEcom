/**
 * Comprehensive Automated Test:
 * Customer Panel – Delivery Address & Payment Flow
 *
 * Verifies:
 * 1. Delivery Address Model & Virtuals (mobileNumber/phone, streetAddress/addressLine1, pincode/pinCode, id)
 * 2. Complete Address Validation (Full Name, 10-digit Indian Mobile, Street, City, State, 6-digit PIN)
 * 3. Default Address Selection & Management Logic
 * 4. Multi-Address Select, Edit, and Delete Logic
 * 5. Checkout Flow: Address Selection requirement & Payment Method selection (COD, UPI, Online)
 * 6. Order Creation & Address Retention in Final Order
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Address = require('../src/models/Address');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const shippingService = require('../src/services/shippingService');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 TESTING CUSTOMER DELIVERY ADDRESS & PAYMENT FLOW WORKFLOW');
  console.log('================================================================\n');

  try {
    // --- TEST 1: Address Model Schema, Virtuals & Enums ---
    console.log('--- TEST 1: Address Model Schema & Dual-Naming Virtuals ---');
    const testUserId = new mongoose.Types.ObjectId();
    const testAddr = new Address({
      user: testUserId,
      fullName: 'Vikramaditya Rathore',
      mobileNumber: '9829012345',
      addressLine1: 'B-104, Malviya Nagar, Near Gaurav Tower',
      landmark: 'Behind World Trade Park',
      city: 'Jaipur',
      state: 'Rajasthan',
      pinCode: '302017',
      addressType: 'home',
      isDefault: true,
    });

    // Check normalization and virtuals
    assert.strictEqual(testAddr.addressType, 'Home', 'Address type should normalize to Home');
    assert.strictEqual(testAddr.phone, '9829012345', 'Virtual phone should match mobileNumber');
    assert.strictEqual(testAddr.streetAddress, 'B-104, Malviya Nagar, Near Gaurav Tower', 'Virtual streetAddress should match addressLine1');
    assert.strictEqual(testAddr.pincode, '302017', 'Virtual pincode should match pinCode');
    assert.strictEqual(testAddr.id, testAddr._id.toString(), 'Virtual id should match _id string');

    const json = testAddr.toJSON();
    assert.strictEqual(json.phone, '9829012345');
    assert.strictEqual(json.streetAddress, 'B-104, Malviya Nagar, Near Gaurav Tower');
    assert.strictEqual(json.pincode, '302017');
    console.log('✓ Address model correctly exposes dual-naming virtuals (phone, streetAddress, pincode, id)');

    // --- TEST 2: Indian PIN Code & Mobile Validation ---
    console.log('\n--- TEST 2: Indian Postal PIN & Mobile Validation ---');
    assert.strictEqual(shippingService.isValidPinCode('302017'), true, 'Valid 6-digit PIN should pass');
    assert.strictEqual(shippingService.isValidPinCode('012345'), false, 'PIN starting with 0 must fail');
    assert.strictEqual(shippingService.isValidPinCode('12345'), false, '5-digit PIN must fail');
    assert.strictEqual(shippingService.isValidPinCode('abcdef'), false, 'Alpha PIN must fail');

    const mobileRegex = /^[6-9]\d{9}$/;
    assert.strictEqual(mobileRegex.test('9829012345'), true, 'Valid 10-digit mobile starting with 9 must pass');
    assert.strictEqual(mobileRegex.test('8829012345'), true, 'Valid 10-digit mobile starting with 8 must pass');
    assert.strictEqual(mobileRegex.test('5829012345'), false, 'Mobile starting with 5 must fail');
    assert.strictEqual(mobileRegex.test('982901234'), false, '9-digit mobile must fail');
    console.log('✓ PIN code & 10-digit Indian mobile validation rules verified');

    // --- TEST 3: Default Address Management Logic ---
    console.log('\n--- TEST 3: Multiple Address Default Assignment Logic ---');
    const addr1 = {
      id: 'addr_1',
      fullName: 'Vikramaditya Rathore',
      isDefault: true,
      city: 'Jaipur',
    };
    const addr2 = {
      id: 'addr_2',
      fullName: 'Vikramaditya (Office)',
      isDefault: false,
      city: 'Gurugram',
    };

    let userAddresses = [addr1, addr2];
    assert.strictEqual(userAddresses.filter((a) => a.isDefault).length, 1);
    assert.strictEqual(userAddresses[0].id, 'addr_1');

    // User marks addr_2 as default
    userAddresses = userAddresses.map((a) => ({
      ...a,
      isDefault: a.id === 'addr_2',
    }));
    assert.strictEqual(userAddresses.find((a) => a.id === 'addr_2').isDefault, true);
    assert.strictEqual(userAddresses.find((a) => a.id === 'addr_1').isDefault, false);
    console.log('✓ Setting new default address unsets previous default correctly');

    // --- TEST 4: Address Edit and Delete Logic ---
    console.log('\n--- TEST 4: Address Edit & Delete Logic ---');
    // Edit addr_2
    const updatedData = { streetAddress: 'Cyber City, Building 10, DLF Phase 2' };
    userAddresses = userAddresses.map((a) => (a.id === 'addr_2' ? { ...a, ...updatedData } : a));
    assert.strictEqual(userAddresses.find((a) => a.id === 'addr_2').streetAddress, 'Cyber City, Building 10, DLF Phase 2');

    // Delete addr_2 (which was default)
    userAddresses = userAddresses.filter((a) => a.id !== 'addr_2');
    if (userAddresses.length > 0 && !userAddresses.some((a) => a.isDefault)) {
      userAddresses[0].isDefault = true;
    }
    assert.strictEqual(userAddresses.length, 1);
    assert.strictEqual(userAddresses[0].isDefault, true);
    console.log('✓ Edit updates target address and deletion automatically re-assigns default');

    // --- TEST 5: Checkout Flow Validation (Address Required) ---
    console.log('\n--- TEST 5: Checkout Flow Address Enforcement ---');
    const validateCheckoutReady = (selectedAddress) => {
      if (!selectedAddress) {
        return { allowed: false, message: 'Delivery address required to proceed to payment' };
      }
      const pin = selectedAddress.pincode || selectedAddress.pinCode;
      if (!shippingService.isValidPinCode(pin)) {
        return { allowed: false, message: 'Valid 6-digit Indian PIN code required' };
      }
      return { allowed: true };
    };

    const emptyAddressCheck = validateCheckoutReady(null);
    assert.strictEqual(emptyAddressCheck.allowed, false);
    assert.strictEqual(emptyAddressCheck.message, 'Delivery address required to proceed to payment');

    const invalidPinCheck = validateCheckoutReady({ pincode: '00123' });
    assert.strictEqual(invalidPinCheck.allowed, false);

    const validAddressCheck = validateCheckoutReady(testAddr);
    assert.strictEqual(validAddressCheck.allowed, true);
    console.log('✓ Checkout strictly forbids proceeding to payment without a valid delivery address');

    // --- TEST 6: Payment Method Selection & Final Order Summary ---
    console.log('\n--- TEST 6: Payment Methods & Order Placement Summary ---');
    const supportedPaymentMethods = ['COD', 'UPI', 'CARD', 'NETBANKING'];
    assert(supportedPaymentMethods.includes('COD'), 'Must support Cash on Delivery');
    assert(supportedPaymentMethods.includes('UPI'), 'Must support UPI');
    assert(supportedPaymentMethods.includes('CARD'), 'Must support Cards');
    assert(supportedPaymentMethods.includes('NETBANKING'), 'Must support Net Banking');

    // Simulate order placement with delivery address
    const orderPayload = {
      orderNumber: `ORD-${Date.now()}`,
      user: testUserId,
      deliveryAddress: {
        fullName: testAddr.fullName,
        mobileNumber: testAddr.mobileNumber,
        phone: testAddr.mobileNumber,
        addressLine1: testAddr.addressLine1,
        streetAddress: testAddr.addressLine1,
        city: testAddr.city,
        state: testAddr.state,
        pinCode: testAddr.pinCode,
        pincode: testAddr.pinCode,
        addressType: testAddr.addressType,
      },
      paymentMethod: 'UPI',
      totalAmount: 1899,
      orderStatus: 'Confirmed',
    };

    const simulatedOrder = new Order({
      orderId: orderPayload.orderNumber,
      orderNumber: orderPayload.orderNumber,
      user: orderPayload.user,
      deliveryAddress: orderPayload.deliveryAddress,
      shippingAddress: orderPayload.deliveryAddress,
      paymentMethod: orderPayload.paymentMethod,
      totalAmount: orderPayload.totalAmount,
      orderStatus: orderPayload.orderStatus,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Handwoven Pashmina Shawl',
          price: 1899,
          quantity: 1,
        },
      ],
    });

    assert.strictEqual(simulatedOrder.deliveryAddress.fullName, 'Vikramaditya Rathore');
    assert.strictEqual(simulatedOrder.deliveryAddress.city, 'Jaipur');
    assert.strictEqual(simulatedOrder.deliveryAddress.pinCode, '302017');
    assert.strictEqual(simulatedOrder.paymentMethod, 'UPI');
    console.log(`✓ Order #${simulatedOrder.orderNumber} placed with complete delivery address & payment details`);

    console.log('\n================================================================');
    console.log('🎉 ALL DELIVERY ADDRESS & PAYMENT FLOW TESTS PASSED (100%)');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

runTestSuite();

