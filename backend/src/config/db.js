/**
 * MongoDB Mongoose Connection Manager
 */
const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Ensure SRV DNS resolution works smoothly on Windows with MongoDB Atlas (+srv://)
if (env.MONGODB_URI && env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (e) {
    // Ignore if not supported in custom environment
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    console.warn('[MongoDB] Make sure MongoDB is running locally or MONGODB_URI is configured.');
    // Do not crash immediately in development so health check and offline handlers work
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Runtime error: ${err.message}`);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed on process termination.');
  process.exit(0);
});

module.exports = connectDB;
module.exports.connectDB = connectDB;

