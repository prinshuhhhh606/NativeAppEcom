/**
 * Environment configuration loader and validator
 */
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/appecom_db',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'appecom_super_secret_access_jwt_key_2026',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'appecom_super_secret_refresh_jwt_key_2026',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
    API_KEY: process.env.CLOUDINARY_API_KEY || 'mock_key',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
  },

  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey12345',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mocksecret12345',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_123',
  },

  SHIPROCKET: {
    EMAIL: process.env.SHIPROCKET_EMAIL || 'logistics@bharatbazaar.in',
    PASSWORD: process.env.SHIPROCKET_PASSWORD || 'ShiprocketPass@123',
  },

  EMAIL: {
    HOST: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    PORT: process.env.EMAIL_PORT || 2525,
    USER: process.env.EMAIL_USER || '',
    PASSWORD: process.env.EMAIL_PASSWORD || '',
    FROM: process.env.EMAIL_FROM || 'support@bharatbazaar.in',
  },

  DELIVERY: {
    FREE_SHIPPING_THRESHOLD: Number(process.env.FREE_SHIPPING_THRESHOLD) || 499,
    STANDARD_DELIVERY_CHARGE: Number(process.env.STANDARD_DELIVERY_CHARGE) || 40,
    EXPRESS_DELIVERY_CHARGE: Number(process.env.EXPRESS_DELIVERY_CHARGE) || 90,
  },

  OTP: {
    EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 10,
    DEFAULT_TEST_OTP: process.env.DEFAULT_TEST_OTP || '123456',
  },

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = env;

