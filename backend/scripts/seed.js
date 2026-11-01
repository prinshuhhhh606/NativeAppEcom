const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');
const Address = require('../src/models/Address');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected.');

    // 1. Clear existing collections
    console.log('Clearing old sample data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Address.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);

    // 2. Create Users
    console.log('Seeding users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@appecom.in',
      phone: '9876543210',
      password: 'AdminPassword@123',
      role: 'admin',
      isPhoneVerified: true,
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    const customer = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.in',
      phone: '9812345678',
      password: 'CustomerPassword@123',
      role: 'customer',
      isPhoneVerified: true,
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    });

    // Create Cart & Wishlist for customer
    await Promise.all([
      Cart.create({ user: customer._id, items: [] }),
      Wishlist.create({ user: customer._id, products: [] }),
    ]);

    // 3. Create Delivery Addresses
    console.log('Seeding delivery addresses...');
    await Address.create([
      {
        user: customer._id,
        fullName: 'Rahul Sharma',
        phone: '9812345678',
        addressLine1: 'Flat 402, Sunshine Heights, Outer Ring Road',
        addressLine2: 'Bellandur',
        landmark: 'Near EcoSpace Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560103',
        addressType: 'home',
        isDefault: true,
      },
      {
        user: customer._id,
        fullName: 'Rahul Sharma',
        phone: '9812345678',
        addressLine1: 'Building 7, Cyber City',
        addressLine2: 'DLF Phase 2',
        landmark: 'Opposite Cyber Hub',
        city: 'Gurugram',
        state: 'Haryana',
        pinCode: '122002',
        addressType: 'work',
        isDefault: false,
      },
    ]);

    // 4. Create Categories
    console.log('Seeding categories...');
    const categories = await Category.create([
      {
        name: 'Mobiles & Tablets',
        slug: 'mobiles-tablets',
        description: 'Smartphones, Tablets, Smartwatches & Accessories',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=600&q=80',
        icon: 'cellphone',
        displayOrder: 1,
        subCategories: [
          { name: 'Android Smartphones', slug: 'android-phones' },
          { name: 'iPhones', slug: 'iphones' },
          { name: 'Earbuds & Headphones', slug: 'audio' },
        ],
      },
      {
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'Men, Women & Kids Clothing and Footwear',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
        icon: 'tshirt-crew',
        displayOrder: 2,
        subCategories: [
          { name: 'Men T-Shirts & Shirts', slug: 'men-shirts' },
          { name: 'Ethnic Wear', slug: 'ethnic-wear' },
          { name: 'Sneakers & Shoes', slug: 'shoes' },
        ],
      },
      {
        name: 'Electronics & Gadgets',
        slug: 'electronics',
        description: 'Laptops, Cameras, Smart Displays and PC accessories',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80',
        icon: 'laptop',
        displayOrder: 3,
        subCategories: [
          { name: 'Laptops & Ultrabooks', slug: 'laptops' },
          { name: 'Smart Home & Audio', slug: 'smart-home' },
        ],
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Cookware, Home Decor, Furniture & Kitchen Essentials',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        icon: 'home',
        displayOrder: 4,
        subCategories: [
          { name: 'Cookware & Appliances', slug: 'cookware' },
          { name: 'Bedding & Furnishing', slug: 'furnishing' },
        ],
      },
    ]);

    const mobileCat = categories[0];
    const fashionCat = categories[1];
    const elecCat = categories[2];
    const homeCat = categories[3];

    // 5. Create Products
    console.log('Seeding products...');
    await Product.create([
      {
        name: 'OnePlus 12 5G (Flowy Emerald, 256 GB)',
        slug: 'oneplus-12-5g-flowy-emerald',
        description: 'Experience flagship performance with Snapdragon 8 Gen 3, Hasselblad Camera for Mobile, and 5400mAh battery with 100W SUPERVOOC charging.',
        price: 64999,
        discountPrice: 59999,
        category: mobileCat._id,
        subCategory: 'Android Smartphones',
        brand: 'OnePlus',
        stock: 45,
        sku: 'OP12-EM-256',
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.8,
        numOfReviews: 1240,
        isFeatured: true,
        isTrending: true,
        isBestSeller: true,
        variants: [
          { name: 'Storage', options: ['256GB', '512GB'] },
          { name: 'Color', options: ['Flowy Emerald', 'Silky Black'] },
        ],
        specifications: [
          { key: 'Processor', value: 'Qualcomm Snapdragon 8 Gen 3' },
          { key: 'RAM', value: '16 GB LPDDR5X' },
          { key: 'Battery', value: '5400 mAh, 100W charging' },
        ],
        tags: ['smartphone', '5g', 'flagship', 'oneplus'],
      },
      {
        name: 'boAt Airdopes 141 ANC TWS Earbuds',
        slug: 'boat-airdopes-141-anc',
        description: 'True Wireless earbuds with up to 32dB Active Noise Cancellation, 42 hours total playtime, BEAST mode for low latency gaming, and ENx tech for clear voice calls.',
        price: 2990,
        discountPrice: 1499,
        category: mobileCat._id,
        subCategory: 'Earbuds & Headphones',
        brand: 'boAt',
        stock: 120,
        sku: 'BOAT-AD-141',
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.4,
        numOfReviews: 8900,
        isFeatured: false,
        isTrending: true,
        isBestSeller: true,
        variants: [
          { name: 'Color', options: ['Carbon Black', 'Cider Cyan'] },
        ],
        tags: ['earbuds', 'audio', 'boat', 'wireless'],
      },
      {
        name: 'Men Slim Fit Solid Pure Cotton Shirt',
        slug: 'men-slim-fit-cotton-shirt',
        description: 'Crafted from breathable 100% premium combed cotton with a structured spread collar. Perfect for formal business meetings as well as weekend casual outings.',
        price: 1999,
        discountPrice: 899,
        category: fashionCat._id,
        subCategory: 'Men T-Shirts & Shirts',
        brand: 'Highlander',
        stock: 80,
        sku: 'HL-SHT-WHT-01',
        images: [
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.3,
        numOfReviews: 640,
        isFeatured: true,
        isTrending: false,
        isBestSeller: false,
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
          { name: 'Color', options: ['Pure White', 'Navy Blue', 'Sky Blue'] },
        ],
        tags: ['clothing', 'shirt', 'men', 'cotton'],
      },
      {
        name: 'Women Pure Silk Kanjeevaram Saree with Blouse Piece',
        slug: 'women-silk-kanjeevaram-saree',
        description: 'Traditional Pan India royal ethnic wear woven with genuine Zari borders, rich pallu, and festive motifs suitable for weddings and ceremonies.',
        price: 8999,
        discountPrice: 3499,
        category: fashionCat._id,
        subCategory: 'Ethnic Wear',
        brand: 'Varkala Silk',
        stock: 35,
        sku: 'VS-KANJ-RED-09',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.7,
        numOfReviews: 430,
        isFeatured: true,
        isTrending: true,
        isBestSeller: true,
        variants: [
          { name: 'Color', options: ['Royal Red & Gold', 'Peacock Blue', 'Emerald Green'] },
        ],
        tags: ['saree', 'ethnic', 'silk', 'traditional'],
      },
      {
        name: 'Apple MacBook Air M3 (13-inch, 16GB, 512GB SSD)',
        slug: 'apple-macbook-air-m3-13inch',
        description: 'Strikingly thin and fast with up to 18 hours battery life. Liquid Retina display, 1080p FaceTime HD camera, and MagSafe 3 charging port.',
        price: 134900,
        discountPrice: 124900,
        category: elecCat._id,
        subCategory: 'Laptops & Ultrabooks',
        brand: 'Apple',
        stock: 20,
        sku: 'APL-MBA-M3-13',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.9,
        numOfReviews: 210,
        isFeatured: true,
        isTrending: false,
        isBestSeller: true,
        variants: [
          { name: 'Color', options: ['Midnight', 'Starlight', 'Space Grey', 'Silver'] },
        ],
        tags: ['macbook', 'apple', 'laptop', 'm3'],
      },
      {
        name: 'Prestige Iris 750 Watt Mixer Grinder with 3 Stainless Steel Jars',
        slug: 'prestige-iris-750w-mixer-grinder',
        description: 'Heavy duty 750W motor with 3 variable speed controls, overload protection, transparent juicer jar, and ergonomic handles for everyday Indian cooking.',
        price: 4995,
        discountPrice: 2899,
        category: homeCat._id,
        subCategory: 'Cookware & Appliances',
        brand: 'Prestige',
        stock: 60,
        sku: 'PRS-IRIS-750',
        images: [
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
        ],
        ratings: 4.2,
        numOfReviews: 3200,
        isFeatured: false,
        isTrending: true,
        isBestSeller: true,
        tags: ['appliances', 'kitchen', 'mixer', 'prestige'],
      },
    ]);

    // 6. Create Coupons
    console.log('Seeding coupons...');
    await Coupon.create([
      {
        code: 'WELCOME100',
        description: 'Flat ₹100 Off on your first order above ₹499',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 499,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 50000,
      },
      {
        code: 'INDIA20',
        description: '20% Off on festive orders up to ₹500',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 799,
        maxDiscountAmount: 500,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 10000,
      },
      {
        code: 'BIGSAVING',
        description: 'Flat ₹300 Off on orders above ₹1,499',
        discountType: 'fixed',
        discountValue: 300,
        minOrderAmount: 1499,
        expiryDate: new Date('2028-12-31'),
      },
    ]);

    console.log('=============================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`👤 Admin: admin@appecom.in / AdminPassword@123`);
    console.log(`👤 Customer: rahul.sharma@example.in / CustomerPassword@123 (Phone: 9812345678)`);
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();

