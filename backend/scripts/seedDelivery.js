/**
 * Seed Complete Delivery Partner Workflow Data
 * Populates DeliveryPartner, DeliveryAssignments, active Delivery, Earnings, and Payouts
 */
const mongoose = require('mongoose');
const env = require('../src/config/env');
const DeliveryPartner = require('../src/models/DeliveryPartner');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const Delivery = require('../src/models/Delivery');
const DeliveryEarning = require('../src/models/DeliveryEarning');
const DeliveryPayout = require('../src/models/DeliveryPayout');
const Seller = require('../src/models/Seller');
const Order = require('../src/models/Order');

const seedCompleteDelivery = async () => {
  try {
    console.log('Connecting to MongoDB at:', env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI);

    // 1. Find or create an approved Seller
    let seller = await Seller.findOne({ email: 'seller@appecom.in' });
    if (!seller) {
      seller = await Seller.findOne();
    }

    // 2. Find or create an Order
    let order = await Order.findOne();
    const fallbackOrderId = order ? order._id : new mongoose.Types.ObjectId();
    const fallbackOrderNumber = order?.orderNumber || 'BBIN-261031-7711';

    // 3. Delete existing demo records for clean seed
    await DeliveryPartner.deleteOne({ email: 'delivery@appecom.in' });

    // 4. Create DeliveryPartner
    const partner = await DeliveryPartner.create({
      name: 'Vikas Kumar',
      email: 'delivery@appecom.in',
      password: 'Delivery@12345',
      phone: '9876501234',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      dob: new Date('1996-08-22'),
      address: {
        addressLine: 'Flat 104, Sunrise Enclave, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
      },
      vehicleType: 'Bike',
      vehicleNumber: 'DL-04-CK-8821',
      drivingLicenseNumber: 'DL1420110012345',
      kycStatus: 'approved',
      kycDocuments: {
        aadharNumber: 'XXXX-XXXX-4819',
        panNumber: 'ABCDE1234F',
        drivingLicenseDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
        vehicleRcDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
        identityProofDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
      },
      adminRemarks: 'Verified Fleet Rider - Pan India Prime',
      bankDetails: {
        accountHolderName: 'Vikas Kumar',
        accountNumber: '918237461928',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        upiId: 'vikas@okhdfcbank',
      },
      emergencyContact: {
        name: 'Suresh Kumar',
        phone: '9876543219',
        relationship: 'Brother',
      },
      availability: 'online',
      isAvailable: true,
      activeCapacity: 3,
      currentActiveDeliveries: 1,
      currentLocation: {
        latitude: 28.6139,
        longitude: 77.209,
        addressText: 'Connaught Place Outer Circle, New Delhi',
        updatedAt: new Date(),
      },
      rating: 4.88,
      acceptanceRate: 98,
      completionRate: 99,
      totalDeliveriesCompleted: 312,
      earnings: {
        available: 1850,
        pending: 350,
        totalEarned: 18450,
        todayEarned: 240,
        weekEarned: 3820,
        monthEarned: 14600,
      },
      isVerified: true,
      isActive: true,
    });

    console.log(`✓ Created Delivery Partner: ${partner.name} (${partner.email})`);

    // Clean up old assignments and deliveries for this partner
    await DeliveryAssignment.deleteMany({ deliveryPartner: partner._id });
    await Delivery.deleteMany({ deliveryPartner: partner._id });
    await DeliveryEarning.deleteMany({ deliveryPartner: partner._id });
    await DeliveryPayout.deleteMany({ deliveryPartner: partner._id });

    // 5. Create 2 Pending Delivery Assignments (Requests)
    const deadline1 = new Date(Date.now() + 10 * 60 * 1000); // 10 mins future
    const deadline2 = new Date(Date.now() + 15 * 60 * 1000); // 15 mins future

    const assignment1 = await DeliveryAssignment.create({
      assignmentId: `ASGN-${Date.now().toString().slice(-6)}-1`,
      order: fallbackOrderId,
      orderNumber: `BBIN-${Date.now().toString().slice(-4)}-91`,
      seller: seller ? seller._id : new mongoose.Types.ObjectId(),
      sellerStoreName: seller?.storeName || 'Bharat Handicrafts & Handloom',
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      status: 'requested',
      responseDeadline: deadline1,
      pickupAddress: {
        storeName: seller?.storeName || 'Bharat Handicrafts & Handloom',
        addressLine: 'Shop 14, Central Market, Lajpat Nagar II',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110024',
        contactPhone: '+91 9811223344',
        latitude: 28.5677,
        longitude: 77.2433,
      },
      deliveryAddress: {
        fullName: 'Aarav Mehta',
        addressLine: 'Tower B, Flat 702, Amrapali Silicon City, Sector 76',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pinCode: '201301',
        mobileNumber: '9876541230',
        latitude: 28.5708,
        longitude: 77.3898,
      },
      packageCount: 1,
      totalWeightKg: 1.2,
      distanceKm: 6.8,
      estimatedMinutes: 35,
      deliveryFee: 75,
      customerName: 'Aarav Mehta',
      maskedCustomerPhone: '+91 98XXX X1230',
      paymentMethod: 'ONLINE',
      amountToCollect: 0,
      specialInstructions: 'Please do not ring bell if baby is sleeping. Call on arrival.',
    });

    const assignment2 = await DeliveryAssignment.create({
      assignmentId: `ASGN-${Date.now().toString().slice(-6)}-2`,
      order: fallbackOrderId,
      orderNumber: `BBIN-${Date.now().toString().slice(-4)}-92`,
      seller: seller ? seller._id : new mongoose.Types.ObjectId(),
      sellerStoreName: 'Khadi India Naturals',
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      status: 'requested',
      responseDeadline: deadline2,
      pickupAddress: {
        storeName: 'Khadi India Naturals',
        addressLine: 'A-21, Hauz Khas Village',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110016',
        contactPhone: '+91 9871100998',
        latitude: 28.5494,
        longitude: 77.1932,
      },
      deliveryAddress: {
        fullName: 'Meera Iyer',
        addressLine: 'B-44, Gulmohar Park, Near Siri Fort',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110049',
        mobileNumber: '9810987654',
        latitude: 28.5539,
        longitude: 77.2144,
      },
      packageCount: 2,
      totalWeightKg: 2.1,
      distanceKm: 3.4,
      estimatedMinutes: 20,
      deliveryFee: 60,
      customerName: 'Meera Iyer',
      maskedCustomerPhone: '+91 98XXX X7654',
      paymentMethod: 'COD',
      amountToCollect: 1250,
      specialInstructions: 'Collect ₹1,250 cash or via QR code. Handover carefully.',
    });

    console.log(`✓ Created 2 incoming Delivery Assignments: ${assignment1.assignmentId}, ${assignment2.assignmentId}`);

    // 6. Create 1 Active Delivery in progress
    const activeAssignment = await DeliveryAssignment.create({
      assignmentId: `ASGN-${Date.now().toString().slice(-6)}-ACTIVE`,
      order: fallbackOrderId,
      orderNumber: fallbackOrderNumber,
      seller: seller ? seller._id : new mongoose.Types.ObjectId(),
      sellerStoreName: seller?.storeName || 'Jaipur Craft Emporium',
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      status: 'accepted',
      acceptedAt: new Date(Date.now() - 20 * 60 * 1000),
      responseDeadline: new Date(Date.now() - 15 * 60 * 1000),
      pickupAddress: {
        storeName: seller?.storeName || 'Jaipur Craft Emporium',
        addressLine: 'Shop 102, Connaught Circus, Block B',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        contactPhone: '+91 9818812345',
        latitude: 28.6315,
        longitude: 77.2167,
      },
      deliveryAddress: {
        fullName: 'Rahul Sharma',
        addressLine: 'House 42, Barakhamba Road',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        mobileNumber: '9876543210',
        latitude: 28.6289,
        longitude: 77.2289,
      },
      packageCount: 1,
      totalWeightKg: 0.9,
      distanceKm: 2.5,
      estimatedMinutes: 18,
      deliveryFee: 65,
      customerName: 'Rahul Sharma',
      maskedCustomerPhone: '+91 98XXX X3210',
      paymentMethod: 'ONLINE',
      amountToCollect: 0,
      specialInstructions: 'Handover directly to security desk if resident is away.',
    });

    const activeDelivery = await Delivery.create({
      deliveryNumber: `DEL-${Date.now().toString().slice(-6)}`,
      assignment: activeAssignment._id,
      order: fallbackOrderId,
      orderNumber: fallbackOrderNumber,
      seller: seller ? seller._id : new mongoose.Types.ObjectId(),
      deliveryPartner: partner._id,
      status: 'reached_pickup',
      pickupAddress: activeAssignment.pickupAddress,
      deliveryAddress: activeAssignment.deliveryAddress,
      pickupOtp: '7821',
      pickupOtpVerified: false,
      deliveryOtp: '4521',
      deliveryOtpVerified: false,
      deliveryFee: 65,
      paymentMethod: 'ONLINE',
      codAmount: 0,
      codCollected: false,
      currentLocation: {
        latitude: 28.6315,
        longitude: 77.2167,
        heading: 45,
        speed: 0,
        updatedAt: new Date(),
      },
      timeline: [
        {
          status: 'assigned',
          title: 'Delivery Rider Assigned',
          notes: 'Partner accepted assignment request',
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
        },
        {
          status: 'reached_pickup',
          title: 'Arrived at Merchant Store',
          notes: 'Partner reached store for package pickup verification',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
      ],
    });

    // Also populate assignedTasks in partner document
    partner.assignedTasks = [
      {
        order: fallbackOrderId,
        orderNumber: fallbackOrderNumber,
        customerName: activeAssignment.deliveryAddress.fullName,
        customerPhone: activeAssignment.deliveryAddress.mobileNumber,
        deliveryAddress: {
          fullName: activeAssignment.deliveryAddress.fullName,
          addressLine1: activeAssignment.deliveryAddress.addressLine,
          city: activeAssignment.deliveryAddress.city,
          state: activeAssignment.deliveryAddress.state,
          pinCode: activeAssignment.deliveryAddress.pinCode,
        },
        paymentMethod: activeAssignment.paymentMethod,
        amountToCollect: activeAssignment.amountToCollect,
        deliveryFee: activeAssignment.deliveryFee,
        status: 'reached_pickup',
        pickupOtp: '7821',
        deliveryOtp: '4521',
        assignedAt: new Date(Date.now() - 20 * 60 * 1000),
      },
    ];
    await partner.save();

    console.log(`✓ Created Active Delivery: ${activeDelivery.deliveryNumber} (Pickup OTP: 7821, Drop OTP: 4521)`);

    // 7. Create Historical Earnings
    const earningsData = [
      {
        deliveryPartner: partner._id,
        orderNumber: 'BBIN-261031-1001',
        type: 'delivery_fee',
        baseFee: 60,
        distanceSurge: 15,
        incentive: 10,
        totalEarned: 85,
        status: 'available',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: 'Standard doorstep delivery + peak surge',
      },
      {
        deliveryPartner: partner._id,
        orderNumber: 'BBIN-261031-1002',
        type: 'delivery_fee',
        baseFee: 55,
        distanceSurge: 10,
        incentive: 15,
        totalEarned: 80,
        status: 'available',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000),
        description: 'Express afternoon drop',
      },
      {
        deliveryPartner: partner._id,
        orderNumber: 'BBIN-261031-1003',
        type: 'delivery_fee',
        baseFee: 65,
        distanceSurge: 0,
        incentive: 10,
        totalEarned: 75,
        status: 'available',
        date: new Date(Date.now() - 8 * 60 * 60 * 1000),
        description: 'On-time delivery incentive earned',
      },
      {
        deliveryPartner: partner._id,
        orderNumber: 'BBIN-261030-9941',
        type: 'delivery_fee',
        baseFee: 70,
        distanceSurge: 20,
        incentive: 0,
        totalEarned: 90,
        status: 'paid',
        date: new Date(Date.now() - 28 * 60 * 60 * 1000),
        description: 'Long-distance inter-city route drop',
      },
    ];

    await DeliveryEarning.insertMany(earningsData);
    console.log(`✓ Seeded ${earningsData.length} Delivery Earnings ledger entries.`);

    // 8. Create Payout History
    const payout1 = await DeliveryPayout.create({
      payoutId: `PAY-${Date.now().toString().slice(-6)}-1`,
      deliveryPartner: partner._id,
      amount: 1200,
      payoutMethod: 'UPI',
      bankDetails: {
        accountHolderName: partner.name,
        accountNumber: '918237461928',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        upiId: 'vikas@okhdfcbank',
      },
      status: 'completed',
      referenceNumber: 'UPI/261031/78912384',
      requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
      adminRemarks: 'Instant UPI settlement processed',
    });

    const payout2 = await DeliveryPayout.create({
      payoutId: `PAY-${Date.now().toString().slice(-6)}-2`,
      deliveryPartner: partner._id,
      amount: 600,
      payoutMethod: 'BANK_TRANSFER',
      bankDetails: {
        accountHolderName: partner.name,
        accountNumber: '918237461928',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        upiId: 'vikas@okhdfcbank',
      },
      status: 'processing',
      referenceNumber: 'NEFT/261031/11928374',
      requestedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      adminRemarks: 'NEFT batch initiated, awaiting bank clearance',
    });

    console.log(`✓ Seeded 2 Payouts: ${payout1.payoutId} (completed), ${payout2.payoutId} (processing)`);
    console.log('\n=============================================');
    console.log('DELIVERY SEED COMPLETED SUCCESSFULLY');
    console.log('Email: delivery@appecom.in');
    console.log('Password: Delivery@12345');
    console.log('Active Pickup OTP: 7821');
    console.log('Active Delivery OTP: 4521');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Delivery seed failed:', err);
    process.exit(1);
  }
};

seedCompleteDelivery();
