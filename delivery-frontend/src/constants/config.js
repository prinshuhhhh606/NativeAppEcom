import { Platform } from 'react-native';

export const Config = {
  APP_NAME: 'Appsica Fleet',
  APP_SUBTITLE: 'Pan-India Logistics Partner Fleet',
  VERSION: '2.4.0',

  // API Candidate Endpoints (USB ADB Reverse + LAN IP + Production)
  API_BASE_URL: 'http://127.0.0.1:5000/api/v1/delivery',
  SOCKET_URL: 'http://127.0.0.1:5000',
  LAN_URL: 'http://192.168.1.16:5000/api/v1/delivery',
  PROD_URL: 'https://appsica-backend.onrender.com/api/v1/delivery',

  CURRENCY: '₹',
  COUNTRY: 'India',
  DEFAULT_CITY: 'New Delhi',
  TIMEZONE: 'Asia/Kolkata',

  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: '@appsica_delivery_token',
    USER: '@appsica_delivery_user',
    REMEMBER: '@appsica_delivery_remember',
    ONLINE_STATUS: '@appsica_delivery_online',
  },
};

export default Config;

