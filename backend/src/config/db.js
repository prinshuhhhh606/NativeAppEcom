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

let lastMongoError = null;

const DIRECT_ATLAS_URI = 'mongodb://prinshuhhhh_db_user:prince_database@ac-v1ex0f3-shard-00-00.zltrmb3.mongodb.net:27017,ac-v1ex0f3-shard-00-01.zltrmb3.mongodb.net:27017,ac-v1ex0f3-shard-00-02.zltrmb3.mongodb.net:27017/appecom_db?ssl=true&replicaSet=atlas-rlk87l-shard-0&authSource=admin';

const connectDB = async (retryCount = 0) => {
  // Alternate between standard replica set URI (bypasses SRV DNS entirely) and SRV URI
  const isDirect = (retryCount % 2 === 0);
  const uri = isDirect ? DIRECT_ATLAS_URI : (env.MONGODB_URI || DIRECT_ATLAS_URI);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    lastMongoError = null;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    lastMongoError = error.message;
    console.error(`[MongoDB] Connection attempt failed (${isDirect ? 'Direct' : 'SRV'}): ${error.message}`);
    console.warn('[MongoDB] Retrying database connection in 3 seconds...');
    
    // Automatically retry connection up to 10 times with alternating strategies
    if (retryCount < 10) {
      await new Promise(resolve => setTimeout(resolve, 3000));
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
module.exports.getLastMongoError = () => lastMongoError;

