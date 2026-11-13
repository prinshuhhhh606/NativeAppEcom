/**
 * MongoDB Mongoose Connection Manager
 */
const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Ensure SRV DNS resolution works smoothly with MongoDB Atlas (+srv://) across Windows and Linux cloud hosts
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if custom environment restricts setting DNS
}

const connectDB = async (retryCount = 0) => {
  const uri = env.MONGODB_URI || 'mongodb+srv://prinshuhhhh_db_user:prince_database@cluster0.zltrmb3.mongodb.net/appecom_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    console.warn('[MongoDB] Retrying database connection in 5 seconds...');
    
    // Automatically retry connection up to 5 times
    if (retryCount < 5) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1);
    }

    if (env.NODE_ENV === 'production') {
      console.error('[MongoDB] Critical: Unable to connect to MongoDB in production.');
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

