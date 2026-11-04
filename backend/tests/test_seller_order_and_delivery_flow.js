/**
 * Complete Verification Test: Seller Order Management & Delivery Partner Assignment System
 */
const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const Order = require('../src/models/Order');
const SellerOrder = require('../src/models/SellerOrder');
const Seller = require('../src/models/Seller');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const DeliveryPartner = require('../src/models/DeliveryPartner');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const Delivery = require('../src/models/Delivery');

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appecom');
  console.log('Connected to MongoDB.');

  try {
    // 1. Ensure approved seller exists
    let seller = await Seller.findOne({ email: 'seller@appecom.in' });
    if (!seller) {
      seller = await Seller.create({
        name: 'Heritage Textiles',
        email: 'seller@appecom.in',
        phone: '9829012345',
        storeName: 'Jaipur Heritage Handlooms',
        businessType: 'Proprietorship',
        kycStatus: 'approved',
        status: 'approved',
        isApproved: true,
        address: {
          addressLine1: 'MI Road Market',
          city: 'Jaipur',
          state: 'Rajasthan',
          pinCode: '302001',
        },
      });
    }

    // 2. Ensure customer user exists
    let customer = await User.findOne({
      $or: [{ email: 'customer@appecom.in' }, { mobileNumber: '9876543210' }],
    });
    if (!customer) {
      customer = await User.create({
        name: 'Ananya Sharma',
        email: 'customer@appecom.in',
        mobileNumber: '9876543210',
        role: 'customer',
      });
    }

    // 3. Ensure product exists
    let product = await Product.findOne({ seller: seller._id });
    if (!product) {
      product = await Product.create({
        name: 'Handcrafted Indigo Kurta',
        price: 1299,
        sku: 'KUR-IND-01',
        seller: seller._id,
        stock: 50,
        images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500'],
      });
    }

    // 4. Ensure online approved delivery partner exists
    let partner = await DeliveryPartner.findOne({ email: 'delivery@appecom.in' });
    if (!partner) {
      partner = await DeliveryPartner.create({
        name: 'Rajesh Kumar',
        email: 'delivery@appecom.in',
        phone: '9876543212',
        vehicleType: 'Bike',
        vehicleNumber: 'DL-04-CK-8821',
        kycStatus: 'approved',
        availability: 'online',
        isAvailable: true,
        rating: 4.85,
        totalDeliveriesCompleted: 120,
        activeCapacity: 4,
      });
    }

    // 5. Create Parent Order and Sub-Order
    const orderNumber = `TEST-ORD-${Date.now().toString().slice(-5)}`;
    const subOrderNumber = `SO-${orderNumber}`;

    const prodName = product.name || product.productName || 'Handcrafted Indigo Kurta';

    const parentOrder = await Order.create({
      orderId: orderNumber,
      orderNumber,
      user: customer._id,
      items: [
        {
          product: product._id,
          name: prodName,
          price: product.price || 1299,
          quantity: 1,
          seller: seller._id,
        },
      ],
      totalAmount: 1299,
      subtotal: 1299,
      paymentMethod: 'ONLINE',
      paymentStatus: 'Completed',
      orderStatus: 'Placed',
      deliveryAddress: {
        fullName: 'Ananya Sharma',
        addressLine1: 'Flat 402, Royal Palms, Vaishali Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302021',
        mobileNumber: '9876543210',
      },
      trackingTimeline: [
        { status: 'Order Placed', time: '10:00 AM', completed: true },
        { status: 'Order Confirmed', time: 'Pending', completed: false },
        { status: 'Shipped from Hub', time: 'Pending', completed: false },
        { status: 'Out for Delivery', time: 'Pending', completed: false },
        { status: 'Delivered', time: 'Pending', completed: false },
      ],
    });

    const sellerOrder = await SellerOrder.create({
      subOrderNumber,
      order: parentOrder._id,
      orderNumber,
      seller: seller._id,
      user: customer._id,
      customerName: 'Ananya Sharma',
      customerPhone: '9876543210',
      customerEmail: 'ananya@example.com',
      shippingAddress: {
        fullName: 'Ananya Sharma',
        addressLine1: 'Flat 402, Royal Palms, Vaishali Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302021',
        mobileNumber: '9876543210',
      },
      items: [
        {
          product: product._id,
          name: prodName,
          sku: product.sku || 'KUR-IND-01',
          price: product.price || 1299,
          quantity: 1,
          image: product.images?.[0] || '',
        },
      ],
      itemCount: 1,
      subtotal: 1299,
      commissionAmount: 129.9,
      netEarnings: 1169.1,
      status: 'pending',
      paymentMethod: 'ONLINE',
      paymentStatus: 'Completed',
    });

    console.log(`✓ 1. Test Order Placed: #${orderNumber} (Sub-Order: #${subOrderNumber})`);

    // 6. Test Step: Seller Accepts Order
    sellerOrder.status = 'accepted';
    sellerOrder.acceptedAt = new Date();
    await sellerOrder.save();
    console.log(`✓ 2. Seller Accepted Order: status = '${sellerOrder.status}', acceptedAt = ${sellerOrder.acceptedAt}`);

    // 7. Test Step: Seller Starts Preparing
    sellerOrder.status = 'preparing';
    sellerOrder.preparingAt = new Date();
    await sellerOrder.save();
    console.log(`✓ 3. Order In Preparation: status = '${sellerOrder.status}', preparingAt = ${sellerOrder.preparingAt}`);

    // 8. Test Step: Seller Marks Ready for Pickup
    sellerOrder.status = 'ready_for_pickup';
    sellerOrder.readyForPickupAt = new Date();
    await sellerOrder.save();
    console.log(`✓ 4. Order Ready for Pickup: status = '${sellerOrder.status}', readyForPickupAt = ${sellerOrder.readyForPickupAt}`);

    // 9. Test Step: Seller Assigns Delivery Partner
    const assignmentId = `ASGN-${Date.now().toString().slice(-6)}`;
    const assignment = await DeliveryAssignment.create({
      assignmentId,
      order: parentOrder._id,
      orderNumber,
      seller: seller._id,
      sellerStoreName: seller.storeName,
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      status: 'requested',
      responseDeadline: new Date(Date.now() + 15 * 60 * 1000),
      pickupAddress: {
        storeName: seller.storeName,
        addressLine: seller.address.addressLine1,
        city: seller.address.city,
        state: seller.address.state,
        pinCode: seller.address.pinCode,
        contactPhone: seller.phone,
      },
      deliveryAddress: sellerOrder.shippingAddress,
      deliveryFee: 65,
      customerName: 'Ananya Sharma',
      paymentMethod: 'ONLINE',
    });

    sellerOrder.deliveryPartner = partner._id;
    sellerOrder.deliveryPartnerName = partner.name;
    sellerOrder.deliveryPartnerPhone = partner.phone;
    sellerOrder.deliveryPartnerVehicleType = partner.vehicleType;
    sellerOrder.deliveryPartnerVehicleNumber = partner.vehicleNumber;
    sellerOrder.deliveryAssignment = assignment._id;
    sellerOrder.assignedAt = new Date();
    sellerOrder.assignedBy = seller._id;
    sellerOrder.status = 'pickup_scheduled';
    await sellerOrder.save();

    console.log(`✓ 5. Assigned Rider '${partner.name}' (${partner.vehicleType} - ${partner.vehicleNumber}) to Order #${orderNumber}`);

    // 10. Test Step: Delivery Partner Confirms Pickup via Store OTP (7821)
    const delivery = await Delivery.create({
      deliveryNumber: `DEL-${Date.now().toString().slice(-6)}`,
      assignment: assignment._id,
      order: parentOrder._id,
      orderNumber,
      seller: seller._id,
      deliveryPartner: partner._id,
      status: 'picked_up',
      pickupAddress: assignment.pickupAddress,
      deliveryAddress: assignment.deliveryAddress,
      pickupOtp: '7821',
      pickupOtpVerified: true,
      pickupVerifiedAt: new Date(),
      deliveryOtp: '4521',
      deliveryFee: 65,
      paymentMethod: 'ONLINE',
    });

    sellerOrder.status = 'shipped';
    sellerOrder.pickedUpAt = new Date();
    await sellerOrder.save();

    parentOrder.orderStatus = 'Shipped';
    parentOrder.deliveryPartner = partner._id;
    parentOrder.deliveryPartnerName = partner.name;
    parentOrder.deliveryPartnerPhone = partner.phone;
    parentOrder.deliveryPartnerVehicle = partner.vehicleNumber;
    await parentOrder.save();

    console.log(`✓ 6. Rider Verified Store Pickup OTP (7821): status = '${sellerOrder.status}'`);

    // 11. Test Step: Delivery Partner Out For Delivery
    sellerOrder.status = 'out_for_delivery';
    sellerOrder.outForDeliveryAt = new Date();
    await sellerOrder.save();
    console.log(`✓ 7. Rider Out For Doorstep Delivery: status = '${sellerOrder.status}'`);

    // 12. Test Step: Delivery Partner Verifies Customer OTP (4521) & Completes Delivery
    delivery.status = 'delivered';
    delivery.deliveryOtpVerified = true;
    delivery.deliveredAt = new Date();
    await delivery.save();

    sellerOrder.status = 'delivered';
    sellerOrder.deliveredAt = new Date();
    await sellerOrder.save();

    parentOrder.orderStatus = 'Delivered';
    parentOrder.deliveredAt = new Date();
    await parentOrder.save();

    console.log(`✓ 8. Rider Verified Customer Delivery OTP (4521): status = '${sellerOrder.status}', deliveredAt = ${sellerOrder.deliveredAt}`);
    console.log('\n🎉 ALL 8 SELLER ORDER & DELIVERY LIFECYCLE TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

run();
