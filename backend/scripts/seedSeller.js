/**
 * Multi-Vendor Seller Seeding Script
 * Seeds demo vendors, catalog products, sub-orders, inventory, and financial ledgers
 */
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const SellerOrder = require('../src/models/SellerOrder');
const SellerLedger = require('../src/models/SellerLedger');
const Payout = require('../src/models/Payout');

const seedSellerData = async () => {
  try {
    console.log('Connecting to MongoDB for Seller Seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB.');

    // 1. Seed or Update Approved Demo Seller
    console.log('Seeding Demo Approved Seller...');
    await Seller.deleteOne({ email: 'seller@appecom.in' });

    const approvedSeller = await Seller.create({
      name: 'Rajesh Sharma',
      email: 'seller@appecom.in',
      password: 'Seller@12345',
      phone: '9829012345',
      businessName: 'Jaipur Heritage Handlooms & Handicrafts',
      businessType: 'proprietorship',
      businessDescription: 'Authentic Rajasthani ethnic wear, Jaipuri quilts, block-print textiles, and artisan wooden handicrafts curated directly from local craftsmen.',
      storeName: 'Jaipur Handlooms',
      storeSlug: 'jaipur-handlooms',
      storeLogo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=400&q=80',
      storeBanner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: '42, Bapu Bazaar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pinCode: '302003',
        country: 'India',
      },
      panNumber: 'ABCDE1234F',
      gstin: '08ABCDE1234F1Z5',
      kycDocuments: {
        panCardImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        gstCertificate: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        addressProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      },
      bankAccount: {
        accountHolderName: 'Jaipur Heritage Handlooms',
        accountNumber: '50100234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: 'Bapu Bazaar, Jaipur',
        isVerified: true,
      },
      status: 'approved',
      commissionRate: 10,
      balance: {
        available: 18450,
        pending: 5200,
        totalEarned: 33650,
        totalWithdrawn: 10000,
      },
      isActive: true,
    });
    console.log(`✓ Approved Seller created: ${approvedSeller.email} / Seller@12345`);

    // 2. Seed a Pending Verification Seller for testing onboarding workflow
    await Seller.deleteOne({ email: 'newvendor@appecom.in' });
    const pendingSeller = await Seller.create({
      name: 'Amitabh Sen',
      email: 'newvendor@appecom.in',
      password: 'Vendor@12345',
      phone: '9830112233',
      businessName: 'Varanasi Silk Weavers Co.',
      businessType: 'partnership',
      businessDescription: 'Traditional handwoven Banarasi sarees, dupattas and bridal brocade.',
      storeName: 'Varanasi Weavers',
      storeSlug: 'varanasi-weavers',
      address: {
        street: '15, Chowk',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        pinCode: '221001',
        country: 'India',
      },
      panNumber: 'PQRST5678G',
      gstin: '09PQRST5678G1Z2',
      bankAccount: {
        accountHolderName: 'Varanasi Silk Weavers Co.',
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000456',
        bankName: 'State Bank of India',
        branchName: 'Main Branch Varanasi',
        isVerified: false,
      },
      status: 'under_review',
      commissionRate: 12,
      isActive: true,
    });
    console.log(`✓ Under-Review Seller created: ${pendingSeller.email} / Vendor@12345`);

    // 3. Find or Create Categories for Seller Products
    let ethnicCat = await Category.findOne({ slug: 'ethnic-wear' });
    if (!ethnicCat) {
      ethnicCat = await Category.findOne();
    }
    const categoryId = ethnicCat ? ethnicCat._id : new mongoose.Types.ObjectId();

    // 4. Seed Products belonging to approvedSeller
    console.log('Seeding Seller Products...');
    const slugs = [
      'royal-jaipuri-bandhani-silk-saree',
      'hand-block-printed-cotton-men-kurta',
      'handcrafted-wooden-ambabari-elephant-figurine',
      'jaipuri-blue-pottery-floral-vase',
      'premium-rajasthani-mulmul-quilt-razai'
    ];
    await Product.deleteMany({ slug: { $in: slugs } });
    await Product.deleteMany({ seller: approvedSeller._id });

    const productsData = [
      {
        productName: 'Royal Jaipuri Pure Bandhani Silk Saree',
        subtitle: 'Traditional hand-dyed bandhej silk with zari border',
        slug: 'royal-jaipuri-bandhani-silk-saree',
        description: 'Luxurious pure georgette silk saree handcrafted with meticulous Rai Bandhej dots by master artisans of Jaipur. Features a grand woven zari pallu and rich contrast blouse piece.',
        highlights: ['100% Pure Silk', 'Handcrafted Rai Bandhej', 'Grand Zari Border', 'Includes Blouse Piece'],
        category: categoryId,
        brand: 'Jaipur Handlooms',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        ],
        price: 3499,
        originalPrice: 5999,
        stock: 24,
        sku: 'JH-SAR-001',
        variants: { colors: ['Crimson Red', 'Royal Blue', 'Emerald Green'], sizes: ['Free Size'] },
        ratings: 4.8,
        reviewsCount: 38,
        tags: ['saree', 'silk', 'bandhani', 'ethnic', 'wedding'],
        isTrending: true,
        isBestSeller: true,
        seller: approvedSeller._id,
        approvalStatus: 'approved',
        gstPercentage: 5,
        hsnCode: '5208',
        weight: 0.6,
        isActive: true,
      },
      {
        productName: 'Hand-Block Printed Pure Cotton Men Kurta',
        subtitle: 'Breathable summer cotton with natural indigo dye',
        slug: 'hand-block-printed-cotton-men-kurta',
        description: 'Authentic Bagru hand block printed long kurta tailored from 100% combed breathable cotton. Mandar collar, dual pockets, and mother-of-pearl buttons.',
        highlights: ['100% Breathable Cotton', 'Natural Dyes', 'Hand Block Printed in Bagru', 'Dual Side Pockets'],
        category: categoryId,
        brand: 'Jaipur Handlooms',
        images: [
          'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        ],
        price: 1199,
        originalPrice: 1999,
        stock: 45,
        sku: 'JH-KUR-002',
        variants: { colors: ['Indigo Blue', 'Earthy Rust', 'Forest Olive'], sizes: ['M', 'L', 'XL', 'XXL'] },
        ratings: 4.6,
        reviewsCount: 22,
        tags: ['kurta', 'men', 'cotton', 'block-print'],
        seller: approvedSeller._id,
        approvalStatus: 'approved',
        gstPercentage: 5,
        hsnCode: '6205',
        weight: 0.35,
        isActive: true,
      },
      {
        productName: 'Handcrafted Wooden Ambabari Elephant Figurine',
        subtitle: 'Intricately carved sheesham wood with brass inlays',
        slug: 'handcrafted-wooden-ambabari-elephant-figurine',
        description: 'Exquisite tabletop showpiece carved from seasoned natural Sheesham wood by traditional woodcarvers. Decorated with fine brass wire inlay work (Tarkashi).',
        highlights: ['Solid Sheesham Wood', 'Tarkashi Brass Inlay', 'Hand Polished Finish', 'Symbol of Prosperity'],
        category: categoryId,
        brand: 'Jaipur Handlooms',
        images: [
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        ],
        price: 1850,
        originalPrice: 2800,
        stock: 3, // Low stock for test alert!
        sku: 'JH-DEC-003',
        variants: { colors: ['Natural Walnut Brown'], sizes: ['6 inches'] },
        ratings: 4.9,
        reviewsCount: 15,
        tags: ['handicraft', 'decor', 'elephant', 'wood'],
        seller: approvedSeller._id,
        approvalStatus: 'approved',
        gstPercentage: 12,
        hsnCode: '4420',
        weight: 1.2,
        isActive: true,
      },
      {
        productName: 'Jaipuri Blue Pottery Hand-Painted Floral Vase',
        subtitle: 'Glazed quartz stone ceramic vase made without clay',
        slug: 'jaipuri-blue-pottery-floral-vase',
        description: 'Famous GI-tagged Jaipur Blue Pottery flower vase, hand-shaped using quartz powder, Fuller earth and gum. Beautiful Persian floral motifs painted with cobalt oxide.',
        highlights: ['GI Tagged Blue Pottery', 'Lead Free Glaze', 'Cobalt Floral Motifs', 'Unique Art Piece'],
        category: categoryId,
        brand: 'Jaipur Handlooms',
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        ],
        price: 950,
        originalPrice: 1500,
        stock: 0, // Out of stock for testing
        sku: 'JH-POT-004',
        variants: { colors: ['Turquoise Blue'], sizes: ['10 inches'] },
        ratings: 4.7,
        reviewsCount: 9,
        tags: ['blue pottery', 'vase', 'decor'],
        seller: approvedSeller._id,
        approvalStatus: 'approved',
        gstPercentage: 12,
        hsnCode: '6912',
        weight: 1.5,
        isActive: true,
      },
      {
        productName: 'Premium Rajasthani Razai (Pure Cotton Quilt)',
        subtitle: 'Mulmul cotton shell with carded natural cotton filling',
        slug: 'premium-rajasthani-mulmul-quilt-razai',
        description: 'Ultra-lightweight yet cosy Jaipuri AC Quilt. Screen printed Sanganeri booti pattern on superfine mulmul fabric, hand-quilted by village artisans.',
        highlights: ['Superfine Mulmul Fabric', 'Ultra Lightweight 800g', 'Hand-stitched Quilting', 'Double Bed Size'],
        category: categoryId,
        brand: 'Jaipur Handlooms',
        images: [
          'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
        ],
        price: 2299,
        originalPrice: 3500,
        stock: 18,
        sku: 'JH-QUILT-005',
        variants: { colors: ['Marigold Yellow', 'Pale Mint', 'Rose Blush'], sizes: ['Double Bed (90x100 in)'] },
        ratings: 4.7,
        reviewsCount: 14,
        tags: ['quilt', 'razai', 'bedding', 'handloom'],
        seller: approvedSeller._id,
        approvalStatus: 'pending_approval', // Testing product pending approval
        gstPercentage: 5,
        hsnCode: '9404',
        weight: 0.9,
        isActive: true,
      },
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`✓ Seeded ${createdProducts.length} products for Jaipur Handlooms`);

    // 5. Seed Customer & Order
    let customer = await User.findOne({ mobileNumber: '9876543210' });
    if (!customer) {
      customer = await User.create({
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        mobileNumber: '9876543210',
        passwordHash: '$2a$10$xyz',
      });
    }

    let mainOrder = await Order.findOne();
    if (!mainOrder) {
      mainOrder = await Order.create({
        orderNumber: 'BBIN-261031-7711',
        user: customer._id,
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].productName,
            price: createdProducts[0].price,
            quantity: 1,
            selectedVariant: { color: 'Crimson Red', size: 'Free Size' },
            image: createdProducts[0].images[0],
          },
        ],
        deliveryAddress: {
          fullName: 'Rahul Sharma',
          mobileNumber: '9876543210',
          addressLine1: 'Flat 402, Sunshine Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400001',
        },
        subtotal: 3499,
        deliveryCharges: 0,
        discount: 0,
        totalAmount: 3499,
        orderStatus: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'UPI',
      });
    }

    // 6. Seed SellerOrders (Multi-vendor Sub-orders)
    console.log('Seeding Seller Sub-orders...');
    await SellerOrder.deleteMany({ seller: approvedSeller._id });

    const subOrdersData = [
      {
        subOrderNumber: 'SO-2610-8801',
        order: mainOrder._id,
        orderNumber: 'BBIN-261031-7711',
        seller: approvedSeller._id,
        user: customer._id,
        customerName: 'Rahul Sharma',
        customerPhone: '9876543210',
        shippingAddress: {
          fullName: 'Rahul Sharma',
          addressLine1: 'Flat 402, Sunshine Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400001',
          mobileNumber: '9876543210',
        },
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].productName,
            sku: createdProducts[0].sku,
            price: createdProducts[0].price,
            quantity: 1,
            selectedVariant: { color: 'Crimson Red', size: 'Free Size' },
            image: createdProducts[0].images[0],
            gstPercentage: 5,
          },
        ],
        itemCount: 1,
        subtotal: 3499,
        commissionRate: 10,
        commissionAmount: 349.9,
        netEarnings: 3149.1,
        status: 'delivered',
        paymentMethod: 'ONLINE',
        paymentStatus: 'Completed',
        shipping: {
          courierName: 'BlueDart Express',
          trackingNumber: 'BLUEDART-882910245',
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        subOrderNumber: 'SO-2610-8802',
        order: mainOrder._id,
        orderNumber: 'BBIN-261031-7722',
        seller: approvedSeller._id,
        user: customer._id,
        customerName: 'Pooja Iyer',
        customerPhone: '9845112233',
        shippingAddress: {
          fullName: 'Pooja Iyer',
          addressLine1: '12th Main, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pinCode: '560038',
          mobileNumber: '9845112233',
        },
        items: [
          {
            product: createdProducts[1]._id,
            name: createdProducts[1].productName,
            sku: createdProducts[1].sku,
            price: createdProducts[1].price,
            quantity: 2,
            selectedVariant: { color: 'Indigo Blue', size: 'L' },
            image: createdProducts[1].images[0],
            gstPercentage: 5,
          },
        ],
        itemCount: 2,
        subtotal: 2398,
        commissionRate: 10,
        commissionAmount: 239.8,
        netEarnings: 2158.2,
        status: 'shipped',
        paymentMethod: 'UPI',
        paymentStatus: 'Completed',
        shipping: {
          courierName: 'Delhivery Surface',
          trackingNumber: 'DELHIVERY-992014115',
          shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        subOrderNumber: 'SO-2610-8803',
        order: mainOrder._id,
        orderNumber: 'BBIN-261031-7733',
        seller: approvedSeller._id,
        user: customer._id,
        customerName: 'Ananya Gupta',
        customerPhone: '9810998877',
        shippingAddress: {
          fullName: 'Ananya Gupta',
          addressLine1: 'Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pinCode: '201301',
          mobileNumber: '9810998877',
        },
        items: [
          {
            product: createdProducts[2]._id,
            name: createdProducts[2].productName,
            sku: createdProducts[2].sku,
            price: createdProducts[2].price,
            quantity: 1,
            selectedVariant: { color: 'Natural Walnut Brown', size: '6 inches' },
            image: createdProducts[2].images[0],
            gstPercentage: 12,
          },
        ],
        itemCount: 1,
        subtotal: 1850,
        commissionRate: 10,
        commissionAmount: 185,
        netEarnings: 1665,
        status: 'new', // Brand new order for testing acceptance
        paymentMethod: 'ONLINE',
        paymentStatus: 'Completed',
        shipping: {
          courierName: 'Delhivery',
          trackingNumber: '',
        },
        createdAt: new Date(),
      },
    ];

    await SellerOrder.insertMany(subOrdersData);
    console.log(`✓ Seeded ${subOrdersData.length} sub-orders for seller`);

    // 7. Seed Financial Ledger
    console.log('Seeding Financial Ledger...');
    await SellerLedger.deleteMany({ seller: approvedSeller._id });

    await SellerLedger.insertMany([
      {
        transactionId: 'TXN-90241801',
        seller: approvedSeller._id,
        type: 'credit',
        category: 'order_sale',
        amount: 3149.1,
        balanceAfter: 28450,
        referenceId: 'SO-2610-8801',
        description: 'Settlement credited for delivered order SO-2610-8801',
        status: 'cleared',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        transactionId: 'TXN-90241802',
        seller: approvedSeller._id,
        type: 'debit',
        category: 'payout_withdrawal',
        amount: 10000,
        balanceAfter: 18450,
        referenceId: 'PAY-20261025-4421',
        description: 'Disbursed bank withdrawal to HDFC A/C ••••7890 (UTR: HDFCN26102500192)',
        status: 'cleared',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    // 8. Seed Payouts
    console.log('Seeding Payout records...');
    await Payout.deleteMany({ seller: approvedSeller._id });

    await Payout.insertMany([
      {
        payoutId: 'PAY-20261025-4421',
        seller: approvedSeller._id,
        amount: 10000,
        bankDetailsSnapshot: {
          accountHolderName: 'Jaipur Heritage Handlooms',
          accountNumberMasked: '••••7890',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
        },
        status: 'completed',
        transactionReference: 'HDFCN26102500192',
        adminNotes: 'NEFT settlement processed successfully.',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        payoutId: 'PAY-20261030-9943',
        seller: approvedSeller._id,
        amount: 5000,
        bankDetailsSnapshot: {
          accountHolderName: 'Jaipur Heritage Handlooms',
          accountNumberMasked: '••••7890',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
        },
        status: 'processing',
        adminNotes: 'Queued for banking cycle settlement.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('======================================================');
    console.log('🎉 MULTI-VENDOR SELLER SEEDING COMPLETED!');
    console.log('🛍️ Approved Seller: seller@appecom.in / Seller@12345');
    console.log('⏳ Under-Review Seller: newvendor@appecom.in / Vendor@12345');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seller seeding error:', err);
    process.exit(1);
  }
};

seedSellerData();
