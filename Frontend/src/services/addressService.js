/**
 * Customer Address Management Service
 * Full synchronization between Backend API and local persistent cache
 */
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';

const SELECTED_CHECKOUT_ADDRESS_KEY = '@appecom_selected_checkout_address';

const normalizeAddress = (addr) => {
  if (!addr) return null;
  const id = addr._id || addr.id || 'addr_' + Date.now();
  const mobile = addr.mobileNumber || addr.phone || '';
  const street = addr.addressLine1 || addr.streetAddress || addr.address || '';
  const pin = addr.pinCode || addr.pincode || '';
  const type = addr.addressType || 'Home';

  return {
    ...addr,
    id: String(id),
    _id: String(id),
    fullName: addr.fullName || addr.name || '',
    mobileNumber: mobile,
    phone: mobile,
    streetAddress: street,
    addressLine1: street,
    landmark: addr.landmark || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: pin,
    pinCode: pin,
    addressType: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
    isDefault: !!addr.isDefault,
  };
};

export const addressService = {
  /**
   * Get all customer saved addresses
   */
  async getAddresses() {
    try {
      const response = await api.get('/addresses');
      const rawList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : response.data?.addresses || [];

      const normalizedList = rawList.map(normalizeAddress);

      if (normalizedList.length > 0) {
        await AsyncStorage.setItem(
          Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
          JSON.stringify(normalizedList)
        );
      }
      return normalizedList;
    } catch (e) {
      try {
        const stored = await AsyncStorage.getItem(Config.STORAGE_KEYS.DELIVERY_ADDRESSES);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed.map(normalizeAddress) : [];
        }
      } catch (err) {}
      return [];
    }
  },

  /**
   * Add new delivery address
   */
  async addAddress(newAddress) {
    const payload = {
      fullName: newAddress.fullName,
      mobileNumber: newAddress.mobileNumber || newAddress.phone,
      phone: newAddress.mobileNumber || newAddress.phone,
      addressLine1: newAddress.streetAddress || newAddress.addressLine1,
      streetAddress: newAddress.streetAddress || newAddress.addressLine1,
      landmark: newAddress.landmark || '',
      city: newAddress.city,
      state: newAddress.state,
      pinCode: newAddress.pincode || newAddress.pinCode,
      pincode: newAddress.pincode || newAddress.pinCode,
      addressType: (newAddress.addressType || 'Home').toLowerCase(),
      isDefault: !!newAddress.isDefault,
    };

    try {
      const response = await api.post('/addresses', payload);
      const saved = normalizeAddress(response.data || response);

      // Refresh and sync local cache
      const cached = await this.getAddresses();
      let updatedList = cached.filter((a) => a.id !== saved.id);
      if (saved.isDefault) {
        updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
      }
      updatedList = [saved, ...updatedList];
      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
        JSON.stringify(updatedList)
      );

      // Auto-remember as selected checkout address
      await this.setSelectedCheckoutAddress(saved);
      return saved;
    } catch (e) {
      // Local fallback for offline/guest mode
      const cached = await this.getAddresses();
      const addressItem = normalizeAddress({
        ...payload,
        id: 'addr_' + Date.now(),
        isDefault: cached.length === 0 || !!newAddress.isDefault,
      });

      let updatedList = cached;
      if (addressItem.isDefault) {
        updatedList = cached.map((a) => ({ ...a, isDefault: false }));
      }
      updatedList = [addressItem, ...updatedList];

      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
        JSON.stringify(updatedList)
      );
      await this.setSelectedCheckoutAddress(addressItem);
      return addressItem;
    }
  },

  /**
   * Update address
   */
  async updateAddress(id, updatedData) {
    const payload = {
      ...updatedData,
      mobileNumber: updatedData.mobileNumber || updatedData.phone,
      phone: updatedData.mobileNumber || updatedData.phone,
      addressLine1: updatedData.streetAddress || updatedData.addressLine1,
      streetAddress: updatedData.streetAddress || updatedData.addressLine1,
      pinCode: updatedData.pincode || updatedData.pinCode,
      pincode: updatedData.pincode || updatedData.pinCode,
    };

    try {
      const response = await api.put(`/addresses/${id}`, payload);
      const updated = normalizeAddress(response.data || response);

      const cached = await this.getAddresses();
      const updatedList = cached.map((a) => {
        if (a.id === id || a._id === id) {
          return updated;
        }
        if (updated.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
        JSON.stringify(updatedList)
      );

      // If the updated address was the selected one, update remembered address
      const selected = await this.getSelectedCheckoutAddress();
      if (selected && (selected.id === id || selected._id === id)) {
        await this.setSelectedCheckoutAddress(updated);
      }

      return updated;
    } catch (e) {
      const cached = await this.getAddresses();
      const updatedList = cached.map((a) => {
        if (a.id === id || a._id === id) {
          return normalizeAddress({ ...a, ...payload, id });
        }
        if (payload.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
        JSON.stringify(updatedList)
      );
      const item = updatedList.find((a) => a.id === id || a._id === id);
      return item;
    }
  },

  /**
   * Delete address
   */
  async deleteAddress(id) {
    try {
      await api.delete(`/addresses/${id}`);
    } catch (e) {}

    const cached = await this.getAddresses();
    const filtered = cached.filter((a) => a.id !== id && a._id !== id);

    // If deleted address was default and other addresses exist, set first as default
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
      JSON.stringify(filtered)
    );

    // Clear remembered checkout address if it was deleted
    const selected = await this.getSelectedCheckoutAddress();
    if (selected && (selected.id === id || selected._id === id)) {
      const newSelected = filtered.find((a) => a.isDefault) || filtered[0] || null;
      await this.setSelectedCheckoutAddress(newSelected);
    }

    return { success: true };
  },

  /**
   * Set Default Delivery Address
   */
  async setDefaultAddress(id) {
    try {
      await api.patch(`/addresses/${id}/set-default`);
    } catch (e) {
      try {
        await api.put(`/addresses/${id}`, { isDefault: true });
      } catch (err) {}
    }

    const cached = await this.getAddresses();
    const updatedList = cached.map((a) => ({
      ...a,
      isDefault: a.id === id || a._id === id,
    }));

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
      JSON.stringify(updatedList)
    );

    const defaultAddr = updatedList.find((a) => a.isDefault);
    if (defaultAddr) {
      await this.setSelectedCheckoutAddress(defaultAddr);
    }
    return defaultAddr;
  },

  /**
   * Save selected delivery address for active checkout session
   */
  async setSelectedCheckoutAddress(address) {
    try {
      if (!address) {
        await AsyncStorage.removeItem(SELECTED_CHECKOUT_ADDRESS_KEY);
      } else {
        await AsyncStorage.setItem(
          SELECTED_CHECKOUT_ADDRESS_KEY,
          JSON.stringify(normalizeAddress(address))
        );
      }
    } catch (e) {}
  },

  /**
   * Get remembered delivery address for active checkout session
   */
  async getSelectedCheckoutAddress() {
    try {
      const stored = await AsyncStorage.getItem(SELECTED_CHECKOUT_ADDRESS_KEY);
      if (stored) {
        return normalizeAddress(JSON.parse(stored));
      }
    } catch (e) {}
    return null;
  },
};

export default addressService;
