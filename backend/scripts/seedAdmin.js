const mongoose = require('mongoose');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/Admin');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const StoreSetting = require('../src/models/StoreSetting');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');

const seedAdminData = async () => {
  try {
    console.log('Connecting to MongoDB for Admin Seeding...');
    await connectDB();
    console.log('Connected to DB.');

    // 1. Seed System Roles
    console.log('Seeding System Roles...');
    await Role.deleteMany({ isSystem: true });

    const rolesData = [
      {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Complete unrestricted access to all modules, team management, and settings',
        permissions: ['*'],
        isSystem: true,
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Standard administrator with full access to store operations and catalog',
        permissions: [
          'dashboard:*',
          'products:*',
          'categories:*',
          'inventory:*',
          'orders:*',
          'customers:*',
          'coupons:*',
          'payments:*',
          'shipping:*',
          'returns:*',
          'reviews:*',
          'reports:*',
          'settings:read',
        ],
        isSystem: true,
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Store manager handling catalog, orders, and customer queries',
        permissions: [
          'dashboard:read',
          'products:*',
          'categories:*',
          'orders:*',
          'customers:read',
          'coupons:*',
          'reviews:*',
        ],
        isSystem: true,
      },
      {
        name: 'Inventory Manager',
        slug: 'inventory_manager',
        description: 'Responsible for warehouse stock adjustments, SKUs, and replenishment',
        permissions: [
          'dashboard:read',
          'products:read',
          'inventory:*',
          'shipping:read',
        ],
        isSystem: true,
      },
      {
        name: 'Order Manager',
        slug: 'order_manager',
        description: 'Fulfillment operations, order dispatch, courier tracking, and returns',
        permissions: [
          'dashboard:read',
          'orders:*',
          'shipping:*',
          'returns:*',
          'payments:read',
        ],
        isSystem: true,
      },
      {
        name: 'Support Manager',
        slug: 'support_manager',
        description: 'Customer assistance, return inspections, reviews moderation',
        permissions: [
          'dashboard:read',
          'customers:*',
          'orders:read',
          'returns:*',
          'reviews:*',
        ],
        isSystem: true,
      },
    ];

    await Role.insertMany(rolesData);
    console.log(`✓ Seeded ${rolesData.length} roles`);

    // 2. Seed Default Super Admin
    console.log('Seeding Super Admin user...');
    await Admin.deleteOne({ email: 'admin@appecom.in' });

    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@appecom.in',
      password: 'Admin@12345',
      phone: '9876543210',
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });
    console.log(`✓ Super Admin created: ${superAdmin.email}`);

    // Also seed a demo Manager for role-testing
    await Admin.deleteOne({ email: 'manager@appecom.in' });
    await Admin.create({
      name: 'Priya Verma (Store Manager)',
      email: 'manager@appecom.in',
      password: 'Manager@12345',
      phone: '9876543211',
      role: 'manager',
      permissions: ['products:*', 'orders:*', 'customers:read'],
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    });
    console.log('✓ Demo Manager created: manager@appecom.in');

    // 3. Seed Default Store Settings
    console.log('Seeding Store Settings...');
    const existingSetting = await StoreSetting.findOne();
    if (!existingSetting) {
      await StoreSetting.create({
        storeName: 'Bharat Bazaar - Pan India E-Commerce',
        contactEmail: 'support@appecom.in',
        contactPhone: '+91 98765 43210',
        gstNumber: '29ABCDE1234F1Z5',
        invoicePrefix: 'INV-BBIN-',
        shipping: {
          freeShippingThreshold: 499,
          standardCharge: 40,
          expressSurcharge: 50,
          codAvailable: true,
        },
        tax: {
          gstRate: 18,
          pricesInclusiveOfTax: true,
        },
      });
      console.log('✓ Store settings initialized');
    }

    // 4. Initialize Inventory records for all products
    console.log('Syncing Inventory records for products...');
    const products = await Product.find();
    for (const p of products) {
      const inv = await Inventory.findOne({ product: p._id });
      if (!inv) {
        await Inventory.create({
          product: p._id,
          sku: p.sku || `SKU-${p._id.toString().slice(-6)}`,
          currentStock: p.stock || 50,
        });
      }
    }
    console.log(`✓ Synced inventory for ${products.length} products`);

    console.log('\n======================================================');
    console.log('🎉 ADMIN SEEDING COMPLETED SUCCESSFULLY!');
    console.log('🔐 Super Admin: admin@appecom.in / Admin@12345');
    console.log('🔐 Manager:     manager@appecom.in / Manager@12345');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Admin seeding failed:', err);
    process.exit(1);
  }
};

seedAdminData();

