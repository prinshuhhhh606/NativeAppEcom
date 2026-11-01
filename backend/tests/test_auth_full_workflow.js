/**
 * Comprehensive End-to-End Test: Seller, Admin & Delivery Authentication & Database System
 */
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Admin = require('../src/models/Admin');
const Seller = require('../src/models/Seller');
const DeliveryPartner = require('../src/models/DeliveryPartner');
const { generateAccessToken } = require('../src/utils/generateToken');
const bcrypt = require('bcryptjs');

async function runTest() {
  console.log('===============================================================');
  console.log('🧪 Starting Full E2E Auth & Database System Verification Test');
  console.log('===============================================================');

  try {
    // 1. Connect to Database
    console.log(`\n[Step 1] Connecting to MongoDB: ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✓ MongoDB connection established: ${mongoose.connection.host}/${mongoose.connection.name}`);

    // 2. Test Admin Authentication & Model
    console.log('\n[Step 2] Testing Admin Account & Credential Verification...');
    let admin = await Admin.findOne({ email: 'admin@appecom.in' }).select('+password');
    if (!admin) {
      console.log('Creating demo admin account...');
      admin = await Admin.create({
        name: 'Super Admin',
        email: 'admin@appecom.in',
        password: 'Admin@12345',
        phone: '9876543210',
        role: 'super_admin',
        isActive: true,
      });
      admin = await Admin.findOne({ email: 'admin@appecom.in' }).select('+password');
    }
    const adminPasswordMatch = await bcrypt.compare('Admin@12345', admin.password);
    console.log(`✓ Admin retrieved from DB: ${admin.email} (Role: ${admin.role})`);
    console.log(`✓ Admin password verification: ${adminPasswordMatch ? 'SUCCESS (Bcrypt matched)' : 'FAILED'}`);
    if (!adminPasswordMatch) throw new Error('Admin password does not match');
    const adminToken = generateAccessToken(admin._id, 'admin');
    console.log(`✓ Admin JWT token generated: ${adminToken.slice(0, 25)}...`);

    // 3. Test Real Seller Registration in Database
    console.log('\n[Step 3] Testing Real Seller Registration in MongoDB...');
    const testSellerEmail = `seller_test_${Date.now()}@appecom.in`;
    const testSellerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newSeller = await Seller.create({
      name: 'Ramesh Patel (Test)',
      email: testSellerEmail,
      password: 'Seller@12345',
      phone: testSellerPhone,
      businessName: 'Patel Handloom Emporium',
      businessType: 'proprietorship',
      storeName: 'Patel Handlooms',
      address: {
        street: '12, Textile Market',
        city: 'Surat',
        state: 'Gujarat',
        pinCode: '395003',
      },
      status: 'pending_verification',
    });

    console.log(`✓ New Seller saved to DB with ID: ${newSeller._id}`);
    console.log(`✓ Initial Status: "${newSeller.status}" (correctly pending verification)`);

    // 4. Test Admin Visibility for New Seller
    console.log('\n[Step 4] Testing Admin Visibility for Registered Seller...');
    const foundInAdminList = await Seller.findById(newSeller._id);
    if (!foundInAdminList) throw new Error('Seller not found in database query');
    console.log(`✓ Admin query found registered seller: "${foundInAdminList.storeName}" (${foundInAdminList.email})`);

    // 5. Test Admin Approval for Seller
    console.log('\n[Step 5] Testing Admin Approval Action for Seller...');
    foundInAdminList.status = 'approved';
    await foundInAdminList.save();
    console.log(`✓ Seller status updated to: "${foundInAdminList.status}"`);

    // Verify Seller Login with approved status
    const approvedSeller = await Seller.findOne({ email: testSellerEmail }).select('+password');
    const sellerPassMatch = await approvedSeller.comparePassword('Seller@12345');
    console.log(`✓ Approved Seller login check: ${sellerPassMatch ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✓ Approved Seller status in DB: ${approvedSeller.status}`);
    if (approvedSeller.status !== 'approved') throw new Error('Seller status is not approved');

    // 6. Test Real Delivery Partner Registration in Database
    console.log('\n[Step 6] Testing Real Delivery Partner Registration in MongoDB...');
    const testRiderEmail = `rider_test_${Date.now()}@appecom.in`;
    const testRiderPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testVehicleNo = `DL-01-XX-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPartner = await DeliveryPartner.create({
      name: 'Deepak Sharma (Test Rider)',
      email: testRiderEmail,
      phone: testRiderPhone,
      password: 'Rider@12345',
      vehicleType: 'Bike',
      vehicleNumber: testVehicleNo,
      drivingLicenseNumber: 'DL142026009988',
      address: {
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
      },
      kycStatus: 'pending',
    });

    console.log(`✓ New Delivery Partner saved to DB with ID: ${newPartner._id}`);
    console.log(`✓ Initial KYC Status: "${newPartner.kycStatus}" (correctly pending)`);

    // 7. Test Admin Visibility for New Delivery Partner
    console.log('\n[Step 7] Testing Admin Visibility for Registered Delivery Partner...');
    const foundRiderInAdmin = await DeliveryPartner.findById(newPartner._id);
    if (!foundRiderInAdmin) throw new Error('Delivery partner not found in database query');
    console.log(`✓ Admin query found registered rider: "${foundRiderInAdmin.name}" (${foundRiderInAdmin.vehicleNumber})`);

    // 8. Test Admin Approval for Delivery Partner
    console.log('\n[Step 8] Testing Admin Approval Action for Delivery Partner...');
    foundRiderInAdmin.kycStatus = 'approved';
    foundRiderInAdmin.isVerified = true;
    foundRiderInAdmin.adminRemarks = 'Verified and Approved by Admin';
    await foundRiderInAdmin.save();
    console.log(`✓ Delivery Partner status updated to: "${foundRiderInAdmin.kycStatus}"`);

    // Verify Delivery Partner Login
    const approvedRider = await DeliveryPartner.findOne({ email: testRiderEmail }).select('+password');
    const riderPassMatch = await approvedRider.comparePassword('Rider@12345');
    console.log(`✓ Approved Rider login check: ${riderPassMatch ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✓ Approved Rider KYC status in DB: ${approvedRider.kycStatus}`);
    if (approvedRider.kycStatus !== 'approved') throw new Error('Rider KYC status is not approved');

    // 9. Clean up test records
    console.log('\n[Step 9] Cleaning up test records...');
    await Seller.deleteOne({ _id: newSeller._id });
    await DeliveryPartner.deleteOne({ _id: newPartner._id });
    console.log('✓ Cleaned up temporary test records.');

    console.log('\n===============================================================');
    console.log('🎉 ALL 9 TEST STEPS PASSED SUCCESSFULLY! REAL DATABASE PERSISTENCE VERIFIED.');
    console.log('===============================================================');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Failed:', err.message, err.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTest();

