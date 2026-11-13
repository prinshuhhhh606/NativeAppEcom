
/**
 * App Configuration & Constants
 * Bharat Bazaar - Customer / Seller / Delivery
 */

import { Platform } from 'react-native';

const PORT = 5000;
const CURRENT_LAN_IP = '10.139.94.95';

// Production Render Backend
const PRODUCTION_API_URL =
  'https://appecom-backend.onrender.com/api';

/**
 * Resolve API URL
 *
 * Production:
 * Android / iOS / Web -> Render Backend
 *
 * Development:
 * Android Emulator -> 10.0.2.2
 * Physical Android -> LAN IP
 * Web / iOS -> localhost
 */
const resolvePrimaryApiUrl = () => {
  // Always use Render in release builds
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  if (
    Platform.OS === 'web' ||
    Platform.OS === 'windows' ||
    Platform.OS === 'macos'
  ) {
    return `http://localhost:${PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    return `http://localhost:${PORT}/api`;
  }

  if (Platform.OS === 'android') {
    const model = (
      Platform.constants?.Model || ''
    ).toLowerCase();

    const brand = (
      Platform.constants?.Brand || ''
    ).toLowerCase();

    const fingerprint = (
      Platform.constants?.Fingerprint || ''
    ).toLowerCase();

    const hardware = (
      Platform.constants?.Hardware || ''
    ).toLowerCase();

    const isEmulator =
      model.includes('sdk') ||
      model.includes('emulator') ||
      model.includes('google_sdk') ||
      (brand.includes('google') && model.includes('sdk')) ||
      fingerprint.startsWith('generic') ||
      hardware.includes('goldfish') ||
      hardware.includes('ranchu');

    if (isEmulator) {
      return `http://10.0.2.2:${PORT}/api`;
    }

    return `http://${CURRENT_LAN_IP}:${PORT}/api`;
  }

  return `http://localhost:${PORT}/api`;
};

/**
 * API Candidate URLs
 * No local fallback in production.
 */
const resolveCandidateUrls = () => {
  if (!__DEV__) {
    return [PRODUCTION_API_URL];
  }

  const primary = resolvePrimaryApiUrl();

  const pool = [
    PRODUCTION_API_URL,
    primary,
    `http://localhost:${PORT}/api`,
    `http://10.0.2.2:${PORT}/api`,
    `http://${CURRENT_LAN_IP}:${PORT}/api`,
    `http://127.0.0.1:${PORT}/api`,
  ];

  return Array.from(new Set(pool));
};

/**
 * Socket Candidate URLs
 */
const resolveCandidateSocketUrls = () => {
  return resolveCandidateUrls().map((url) =>
    url.replace(/\/api\/?$/, '')
  );
};

const getSocketUrl = () => {
  return resolvePrimaryApiUrl().replace(/\/api\/?$/, '');
};

export const Config = {
  APP_NAME: 'AppsicaEcom',
  APP_SUBTITLE: 'Premium Multi-Vendor E-Commerce',
  VERSION: '1.0.0',

  // API Configuration
  API_BASE_URL: resolvePrimaryApiUrl(),
  API_CANDIDATE_URLS: resolveCandidateUrls(),

  // Socket Configuration
  SOCKET_URL: getSocketUrl(),
  SOCKET_CANDIDATE_URLS: resolveCandidateSocketUrls(),

  API_TIMEOUT: 20000,

  /**
   * Update API Base URL dynamically
   */
  updateApiBaseUrl(newUrl) {
    if (!newUrl) return;

    const cleanUrl = newUrl.replace(/\/+$/, '');

    this.API_BASE_URL = cleanUrl.endsWith('/api')
      ? cleanUrl
      : `${cleanUrl}/api`;

    this.SOCKET_URL = this.API_BASE_URL.replace(
      /\/api\/?$/,
      ''
    );
  },

  // Pan India Delivery defaults
  CURRENCY_SYMBOL: '₹',
  DEFAULT_PINCODE: '110001',
  DEFAULT_CITY: 'New Delhi',
  DEFAULT_STATE: 'Delhi',

  FREE_SHIPPING_THRESHOLD: 499,
  STANDARD_DELIVERY_CHARGE: 40,
  EXPRESS_DELIVERY_CHARGE: 90,

  // Storage Keys
  STORAGE_KEYS: {
    USER_TOKEN: '@appecom_user_token',
    REFRESH_TOKEN: '@appecom_refresh_token',
    USER_DATA: '@appecom_user_data',
    USER_ROLE: '@appecom_user_role',
    REMEMBER_LOGIN: '@appecom_remember_login',

    ADMIN_TOKEN: '@appecom_admin_token',
    ADMIN_REFRESH_TOKEN: '@appecom_admin_refresh_token',
    ADMIN_DATA: '@appecom_admin_data',

    SELLER_TOKEN: '@appecom_seller_token',
    SELLER_REFRESH_TOKEN: '@appecom_seller_refresh_token',
    SELLER_DATA: '@appecom_seller_data',

    ACTIVE_APP_MODE: '@appecom_active_app_mode',

    DELIVERY_TOKEN: '@appecom_delivery_token',
    DELIVERY_DATA: '@appecom_delivery_data',

    CART_ITEMS: '@appecom_cart_items',
    WISHLIST_ITEMS: '@appecom_wishlist_items',

    SELECTED_PINCODE: '@appecom_selected_pincode',
    DELIVERY_ADDRESSES: '@appecom_saved_addresses',
    DEFAULT_ADDRESS_ID: '@appecom_default_address_id',

    ONBOARDING_COMPLETED: '@appecom_onboarding_done',
  },

  // Contact & Support
  SUPPORT_PHONE: '+91 1800 200 4567',
  SUPPORT_EMAIL: 'support@bharatbazaar.in',

  RETURN_POLICY_DAYS: 7,
};

export default Config;
