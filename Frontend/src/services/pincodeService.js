/**
 * Pan India Delivery & PIN Code Service
 * Manages serviceability checks, transit calculation, and delivery fees
 */
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { findPincodeInfo } from '../models/pincodeModel';
import { validatePincode } from '../utils/validation';

export const pincodeService = {
  /**
   * Check PIN Code Serviceability
   */
  async checkServiceability(pincode) {
    const validation = validatePincode(pincode);
    if (!validation.isValid) {
      return {
        isServiceable: false,
        message: validation.message,
        pincode,
      };
    }

    try {
      const response = await api.get(`/delivery/check-pincode/${pincode}`);
      return response.data;
    } catch (e) {
      // Offline fallback lookup
      const info = findPincodeInfo(pincode);
      if (!info || !info.isServiceable) {
        return {
          isServiceable: false,
          pincode,
          city: info?.city || '',
          state: info?.state || '',
          message:
            info?.unserviceableReason ||
            `Sorry, delivery is currently not available for PIN Code ${pincode}`,
        };
      }

      return {
        isServiceable: true,
        pincode: info.pincode,
        city: info.city,
        district: info.district,
        state: info.state,
        zone: info.zone,
        deliveryDays: info.deliveryDays,
        deliveryCharge: info.deliveryCharge,
        codAvailable: info.codAvailable,
        expressAvailable: info.expressAvailable,
        message: `Delivery available to ${info.city}, ${info.state}`,
      };
    }
  },

  /**
   * Get Current Selected PIN code from storage
   */
  async getSavedPincode() {
    try {
      const saved = await AsyncStorage.getItem(Config.STORAGE_KEYS.SELECTED_PINCODE);
      if (saved) return JSON.parse(saved);
      // Default
      return findPincodeInfo(Config.DEFAULT_PINCODE);
    } catch (e) {
      return findPincodeInfo(Config.DEFAULT_PINCODE);
    }
  },

  /**
   * Save Selected Delivery PIN code
   */
  async setSavedPincode(pincodeInfo) {
    try {
      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.SELECTED_PINCODE,
        JSON.stringify(pincodeInfo)
      );
    } catch (e) {
      console.warn('Failed to save pincode to storage', e);
    }
  },

  /**
   * Calculate delivery charges based on cart amount
   */
  calculateDeliveryCharge(cartSubtotal, baseCharge = Config.STANDARD_DELIVERY_CHARGE) {
    if (cartSubtotal >= Config.FREE_SHIPPING_THRESHOLD) {
      return 0; // Free delivery
    }
    return baseCharge;
  },
};

export default pincodeService;

