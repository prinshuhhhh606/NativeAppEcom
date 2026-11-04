/**
 * Common formatting and calculation helpers
 */
import { Config } from '../constants/config';

/**
 * Format currency into Indian Rupee format (e.g. ₹1,499)
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Math.round(Number(amount));
  return `${Config.CURRENCY_SYMBOL}${num.toLocaleString('en-IN')}`;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (originalPrice, sellingPrice) => {
  if (!originalPrice || !sellingPrice || originalPrice <= sellingPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
};

/**
 * Format estimated delivery date based on transit days
 */
export const formatEstimatedDelivery = (transitDays = 3) => {
  const date = new Date();
  date.setDate(date.getDate() + transitDays);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};

/**
 * Format timestamp into readable date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Mask mobile number for privacy (e.g. +91 98****3210)
 */
export const maskMobileNumber = (mobile) => {
  if (!mobile) return '';
  const cleaned = mobile.toString().replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return mobile;
  const start = cleaned.substring(0, 2);
  const end = cleaned.substring(cleaned.length - 3);
  return `+91 ${start}*****${end}`;
};

/**
 * Truncate long text
 */
export const truncateText = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate random order ID
 */
export const generateOrderId = () => {
  const prefix = 'BBIN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Resolve full image URL for local uploads and remote CDNs
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
  }
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://') ||
    url.startsWith('content://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const baseUrl = (Config.API_BASE_URL || `http://${Config.CURRENT_LAN_IP || '192.168.1.16'}:5000/api`).replace(/\/api.*$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Generate bandwidth-friendly thumbnail URL for list virtualization
 */
export const getThumbnailUrl = (url, width = 360) => {
  const full = getImageUrl(url);
  if (full.includes('images.unsplash.com')) {
    return full.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, 'q=75');
  }
  return full;
};

export default {
  formatPrice,
  calculateDiscount,
  formatEstimatedDelivery,
  formatDate,
  maskMobileNumber,
  truncateText,
  generateOrderId,
  getImageUrl,
  getThumbnailUrl,
};

