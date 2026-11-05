/**
 * App Configuration & Constants
 */
import { Platform } from 'react-native';

const PORT = 5000;
const CURRENT_LAN_IP = '10.139.94.95'; // Active Wi-Fi LAN IP (auto-detected via ipconfig)

/**
 * Detect runtime environment and determine ideal primary API URL:
 * - Android Emulator: http://10.0.2.2:5000/api
 * - Physical Android Device: http://<LAN_IP>:5000/api (or http://localhost:5000/api via adb reverse)
 * - Web / iOS Simulator: http://localhost:5000/api
 */
const resolvePrimaryApiUrl = () => {
  if (Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos') {
    return `http://localhost:${PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    return __DEV__ ? `http://localhost:${PORT}/api` : `http://${CURRENT_LAN_IP}:${PORT}/api`;
  }

  if (Platform.OS === 'android') {
    const model = (Platform.constants?.Model || '').toLowerCase();
    const brand = (Platform.constants?.Brand || '').toLowerCase();
    const fingerprint = (Platform.constants?.Fingerprint || '').toLowerCase();
    const hardware = (Platform.constants?.Hardware || '').toLowerCase();

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

const resolveCandidateUrls = () => {
  const primary = resolvePrimaryApiUrl();
  const pool = [
    primary,
    `http://localhost:${PORT}/api`,
    `http://10.0.2.2:${PORT}/api`,
    `http://${CURRENT_LAN_IP}:${PORT}/api`,
    `http://127.0.0.1:${PORT}/api`,
  ];
  return Array.from(new Set(pool));
};

const resolveCandidateSocketUrls = () => {
  const primarySocket = resolvePrimaryApiUrl().replace(/\/api\/?$/, '');
  const pool = [
    primarySocket,
    `http://localhost:${PORT}`,
    `http://10.0.2.2:${PORT}`,
    `http://${CURRENT_LAN_IP}:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ];
  return Array.from(new Set(pool));
};

export const Config = {
  APP_NAME: 'AppsicaEcom',
  APP_SUBTITLE: 'Premium Multi-Vendor E-Commerce',
  VERSION: '1.0.0',

  // Backend API URL (Dynamically configured for Emulator, LAN, and Web)
  API_BASE_URL: resolvePrimaryApiUrl(),
  API_CANDIDATE_URLS: resolveCandidateUrls(),
  SOCKET_URL: resolvePrimaryApiUrl().replace(/\/api\/?$/, ''),
  SOCKET_CANDIDATE_URLS: resolveCandidateSocketUrls(),
  API_TIMEOUT: 8000,

  updateApiBaseUrl(newUrl) {
    if (!newUrl) return;
    const cleanUrl = newUrl.replace(/\/+$/, '');
    this.API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    this.SOCKET_URL = this.API_BASE_URL.replace(/\/api\/?$/, '');
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

