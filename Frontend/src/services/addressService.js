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
   * Fast read from local AsyncStorage without any network delay
   */
  async getLocalCachedAddresses() {
    try {
      const stored = await AsyncStorage.getItem(Config.STORAGE_KEYS.DELIVERY_ADDRESSES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(normalizeAddress) : [];
      }
    } catch (err) {}
    return [];
  },

  /**
   * Get all customer saved addresses
   * Returns local cache immediately for 0ms render, and revalidates in background
   */
  async getAddresses(forceRefresh = false) {
    const cached = await this.getLocalCachedAddresses();

    if (!forceRefresh && cached.length > 0) {
      // Background revalidation (fire and forget)
      api
        .get('/addresses')
        .then((response) => {
          const rawList = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : response.data?.addresses || [];
          const normalizedList = rawList.map(normalizeAddress);
          if (normalizedList.length > 0) {
            AsyncStorage.setItem(
              Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
              JSON.stringify(normalizedList)
            ).catch(() => {});
          }
        })
        .catch(() => {});

      return cached;
    }

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
      return normalizedList.length > 0 ? normalizedList : cached;
    } catch (e) {
      return cached;
    }
  },

  /**
   * Add new delivery address (Ultra-fast single-call with local cache sync)
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

    // 1. Read existing local cache immediately
    const cached = await this.getLocalCachedAddresses();

    try {
      // 2. Single POST request
      const response = await api.post('/addresses', payload);
      const saved = normalizeAddress(response.data || response);

      // 3. Update local cache directly without secondary network fetch
      let updatedList = cached.filter((a) => a.id !== saved.id);
      if (saved.isDefault) {
        updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
      }
      updatedList = [saved, ...updatedList];

      await Promise.all([
        AsyncStorage.setItem(
          Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
          JSON.stringify(updatedList)
        ),
        this.setSelectedCheckoutAddress(saved),
      ]);

      return saved;
    } catch (e) {
      // Local fallback for offline/guest mode
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

      await Promise.all([
        AsyncStorage.setItem(
          Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
          JSON.stringify(updatedList)
        ),
        this.setSelectedCheckoutAddress(addressItem),
      ]);

      return addressItem;
    }
  },

  /**
   * Update address (Fast single-call with local cache sync)
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

    const cached = await this.getLocalCachedAddresses();

    try {
      const response = await api.put(`/addresses/${id}`, payload);
      const updated = normalizeAddress(response.data || response);

      const updatedList = cached.map((a) => {
        if (a.id === id || a._id === id) {
          return updated;
        }
        if (updated.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });

      await Promise.all([
        AsyncStorage.setItem(
          Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
          JSON.stringify(updatedList)
        ),
        this.setSelectedCheckoutAddress(updated),
      ]);

      return updated;
    } catch (e) {
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
    const cached = await this.getLocalCachedAddresses();
    const filtered = cached.filter((a) => a.id !== id && a._id !== id);

    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    // Update storage immediately
    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.DELIVERY_ADDRESSES,
      JSON.stringify(filtered)
    );

    const selected = await this.getSelectedCheckoutAddress();
    if (selected && (selected.id === id || selected._id === id)) {
      const newSelected = filtered.find((a) => a.isDefault) || filtered[0] || null;
      await this.setSelectedCheckoutAddress(newSelected);
    }

    // Fire delete in background
    api.delete(`/addresses/${id}`).catch(() => {});

    return { success: true };
  },

  /**
   * Set Default Delivery Address
   */
  async setDefaultAddress(id) {
    const cached = await this.getLocalCachedAddresses();
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

    // Fire API update in background
    api.patch(`/addresses/${id}/set-default`).catch(() => {
      api.put(`/addresses/${id}`, { isDefault: true }).catch(() => {});
    });

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
