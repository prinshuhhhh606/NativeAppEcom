const dns = require('dns');
const mongoose = require('mongoose');
const env = require('../src/config/env');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const SellerOrder = require('../src/models/SellerOrder');
const User = require('../src/models/User');

async function inspectDb() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const sellers = await Seller.find({}, '_id name email storeName status isVerified');
    console.log('\n--- SELLERS in DB ---');
    console.log(JSON.stringify(sellers, null, 2));

    const products = await Product.find({}, '_id productName name price stock seller approvalStatus isActive');
    console.log(`\n--- PRODUCTS in DB (${products.length} total) ---`);
    products.slice(0, 10).forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.productName || p.name}, Seller: ${p.seller}, Approval: ${p.approvalStatus}, Active: ${p.isActive}`);
    });

    const orders = await Order.find({}, '_id orderId orderNumber user totalAmount orderStatus status sellers sellerOrders createdAt').sort({ createdAt: -1 });
    console.log(`\n--- PARENT ORDERS in DB (${orders.length} total) ---`);
    orders.slice(0, 5).forEach(o => {
      console.log(`- ID: ${o._id}, OrderId: ${o.orderId || o.orderNumber}, Status: ${o.orderStatus || o.status}, Sellers: ${o.sellers}, SellerOrders: ${o.sellerOrders?.length}`);
    });

    const sellerOrders = await SellerOrder.find({}, '_id subOrderNumber orderNumber seller user status netEarnings createdAt').sort({ createdAt: -1 });
    console.log(`\n--- SELLER ORDERS in DB (${sellerOrders.length} total) ---`);
    sellerOrders.slice(0, 10).forEach(so => {
      console.log(`- ID: ${so._id}, SubOrder: ${so.subOrderNumber}, OrderNo: ${so.orderNumber}, Seller: ${so.seller}, Status: ${so.status}`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

inspectDb();
