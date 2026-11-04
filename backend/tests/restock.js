const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Product = require('../src/models/Product');

async function restock() {
  await mongoose.connect(env.MONGODB_URI);
  await Product.updateMany({}, { $set: { stock: 50, isActive: true } });
  console.log('Restocked products to 50 units');
  process.exit(0);
}
restock();

