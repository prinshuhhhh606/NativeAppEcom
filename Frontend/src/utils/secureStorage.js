/**
 * Secure Storage Utility for Authentication Sessions
 * Manages persistent token storage, role isolation, and session lifecycle.
 * Fully compatible with @react-native-async-storage/async-storage v1.x, v2.x, and v3.x
 * (handles setMany/removeMany in v3 and multiSet/multiRemove in v1/v2).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';

// High-speed in-memory session cache to eliminate repeated disk reads on API calls
const memoryCache = {
  tokens: new Map(),
  session: null,
};

function getCachedToken(key) {
  if (memoryCache.tokens.has(key)) {
    return memoryCache.tokens.get(key);
  }
  return null;
}

function setCachedToken(key, value) {
  if (key) {
    if (value != null) {
      memoryCache.tokens.set(key, String(value));
    } else {
      memoryCache.tokens.delete(key);
    }
  }
}

function clearMemoryCache() {
  memoryCache.tokens.clear();
  memoryCache.session = null;
}

/**
 * Universal helper to store multiple key-value pairs safely across all AsyncStorage versions
 */
async function safeSetItems(pairs) {
  if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return;

  const validPairs = pairs
    .filter(([k, v]) => k != null && v != null)
    .map(([k, v]) => [String(k), String(v)]);

  // v3.x API: setMany({ key: value })
  if (AsyncStorage && typeof AsyncStorage.setMany === 'function') {
    const entries = {};
    for (const [k, v] of validPairs) {
      entries[k] = v;
    }
    await AsyncStorage.setMany(entries);
    return;
  }

  // v1.x / v2.x API: multiSet([[key, value]])
  if (AsyncStorage && typeof AsyncStorage.multiSet === 'function') {
    await AsyncStorage.multiSet(validPairs);
    return;
  }

  // Universal Fallback: Individual setItem calls in parallel
  await Promise.all(
    validPairs.map(([k, v]) => AsyncStorage.setItem(k, v))
  );
}

/**
 * Universal helper to remove multiple keys safely across all AsyncStorage versions
 */
async function safeRemoveItems(keys) {
  if (!keys || !Array.isArray(keys) || keys.length === 0) return;

  const validKeys = keys.filter((k) => k != null).map(String);

  // v3.x API: removeMany([key1, key2])
  if (AsyncStorage && typeof AsyncStorage.removeMany === 'function') {
    await AsyncStorage.removeMany(validKeys);
    return;
  }

  // v1.x / v2.x API: multiRemove([key1, key2])
  if (AsyncStorage && typeof AsyncStorage.multiRemove === 'function') {
    await AsyncStorage.multiRemove(validKeys);
    return;
  }

  // Universal Fallback: Individual removeItem calls in parallel
  await Promise.all(
    validKeys.map((k) => AsyncStorage.removeItem(k))
  );
}

/**
 * Universal helper to get single key safely
 */
async function safeGetItem(key) {
  if (!key || !AsyncStorage || typeof AsyncStorage.getItem !== 'function') return null;
  try {
    return await AsyncStorage.getItem(String(key));
  } catch (e) {
    return null;
  }
}

export const secureStorage = {
  /**
   * Save an authenticated session (Customer, Admin, Seller, or Delivery Partner)
   */
  async saveAuthSession({ token, refreshToken, user, role = 'customer', remember = true }) {
    try {
      const normalizedRole = role || 'customer';
      const isAdmin =
        normalizedRole === 'admin' ||
        normalizedRole === 'super_admin' ||
        normalizedRole === 'manager';
      const isSeller = normalizedRole === 'seller';
      const isDelivery = normalizedRole === 'delivery';

      let tokenKey = Config.STORAGE_KEYS.USER_TOKEN;
      let refreshKey = Config.STORAGE_KEYS.REFRESH_TOKEN;
      let dataKey = Config.STORAGE_KEYS.USER_DATA;

      if (isAdmin) {
        tokenKey = Config.STORAGE_KEYS.ADMIN_TOKEN;
        refreshKey = Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN;
        dataKey = Config.STORAGE_KEYS.ADMIN_DATA;
      } else if (isSeller) {
        tokenKey = Config.STORAGE_KEYS.SELLER_TOKEN;
        refreshKey = Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN;
        dataKey = Config.STORAGE_KEYS.SELLER_DATA;
      } else if (isDelivery) {
        tokenKey = Config.STORAGE_KEYS.DELIVERY_TOKEN;
        refreshKey = null;
        dataKey = Config.STORAGE_KEYS.DELIVERY_DATA;
      }

      const itemsToSet = [
        [tokenKey, token || ''],
        [Config.STORAGE_KEYS.USER_ROLE, normalizedRole],
        [Config.STORAGE_KEYS.REMEMBER_LOGIN, remember ? 'true' : 'false'],
      ];

      if (refreshToken && refreshKey) {
        itemsToSet.push([refreshKey, refreshToken]);
      }

      if (user) {
        itemsToSet.push([dataKey, JSON.stringify(user)]);
      }

      await safeSetItems(itemsToSet);
      // Synchronize in-memory cache
      setCachedToken(tokenKey, token);
      if (refreshKey && refreshToken) setCachedToken(refreshKey, refreshToken);
      setCachedToken(Config.STORAGE_KEYS.USER_ROLE, normalizedRole);
      memoryCache.session = null; // Invalidate to rebuild cleanly
      return true;
    } catch (error) {
      console.warn('Error saving auth session to secure storage:', error);
      return false;
    }
  },

  /**
   * Retrieve active authentication session
   */
  async getAuthSession() {
    try {
      const role = await safeGetItem(Config.STORAGE_KEYS.USER_ROLE);
      const rememberStr = await safeGetItem(Config.STORAGE_KEYS.REMEMBER_LOGIN);
      const remember = rememberStr !== 'false';

      if (!role) {
        return {
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          remember: false,
          isAuthenticated: false,
          isAdmin: false,
          isSeller: false,
          isDelivery: false,
        };
      }

      const isAdmin =
        role === 'admin' || role === 'super_admin' || role === 'manager';
      const isSeller = role === 'seller';
      const isDelivery = role === 'delivery';

      let tokenKey = Config.STORAGE_KEYS.USER_TOKEN;
      let refreshKey = Config.STORAGE_KEYS.REFRESH_TOKEN;
      let dataKey = Config.STORAGE_KEYS.USER_DATA;

      if (isAdmin) {
        tokenKey = Config.STORAGE_KEYS.ADMIN_TOKEN;
        refreshKey = Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN;
        dataKey = Config.STORAGE_KEYS.ADMIN_DATA;
      } else if (isSeller) {
        tokenKey = Config.STORAGE_KEYS.SELLER_TOKEN;
        refreshKey = Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN;
        dataKey = Config.STORAGE_KEYS.SELLER_DATA;
      } else if (isDelivery) {
        tokenKey = Config.STORAGE_KEYS.DELIVERY_TOKEN;
        refreshKey = null;
        dataKey = Config.STORAGE_KEYS.DELIVERY_DATA;
      }

      const [token, refreshToken, userDataStr] = await Promise.all([
        safeGetItem(tokenKey),
        refreshKey ? safeGetItem(refreshKey) : Promise.resolve(null),
        safeGetItem(dataKey),
      ]);

      let user = null;
      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr);
        } catch (parseError) {
          console.warn('Failed to parse cached user data:', parseError);
        }
      }

      return {
        token,
        refreshToken,
        user,
        role,
        remember,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isSeller,
        isDelivery,
      };
    } catch (error) {
      console.warn('Error reading auth session from secure storage:', error);
      return {
        token: null,
        refreshToken: null,
        user: null,
        role: null,
        remember: false,
        isAuthenticated: false,
        isAdmin: false,
        isSeller: false,
        isDelivery: false,
      };
    }
  },

  /**
   * Get currently active access token (In-Memory Fast Path)
   */
  async getAccessToken() {
    try {
      const role = getCachedToken(Config.STORAGE_KEYS.USER_ROLE) || (await safeGetItem(Config.STORAGE_KEYS.USER_ROLE));
      if (role) setCachedToken(Config.STORAGE_KEYS.USER_ROLE, role);

      let key = Config.STORAGE_KEYS.USER_TOKEN;
      if (role === 'admin' || role === 'super_admin' || role === 'manager') {
        key = Config.STORAGE_KEYS.ADMIN_TOKEN;
      } else if (role === 'seller') {
        key = Config.STORAGE_KEYS.SELLER_TOKEN;
      } else if (role === 'delivery') {
        key = Config.STORAGE_KEYS.DELIVERY_TOKEN;
      }

      const cached = getCachedToken(key);
      if (cached) return cached;

      const token = await safeGetItem(key);
      if (token) setCachedToken(key, token);
      return token;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken() {
    try {
      const role = await safeGetItem(Config.STORAGE_KEYS.USER_ROLE);
      if (role === 'admin' || role === 'super_admin' || role === 'manager') {
        return await safeGetItem(Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
      }
      if (role === 'seller') {
        return (
          (await safeGetItem(Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN)) ||
          (await safeGetItem(Config.STORAGE_KEYS.REFRESH_TOKEN))
        );
      }
      return await safeGetItem(Config.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (e) {
      return null;
    }
  },

  /**
   * Update stored access token (e.g. after silent refresh)
   */
  async updateAccessToken(newToken) {
    try {
      const role = await safeGetItem(Config.STORAGE_KEYS.USER_ROLE);
      let tokenKey = Config.STORAGE_KEYS.USER_TOKEN;
      if (role === 'admin' || role === 'super_admin' || role === 'manager') {
        tokenKey = Config.STORAGE_KEYS.ADMIN_TOKEN;
      } else if (role === 'seller') {
        tokenKey = Config.STORAGE_KEYS.SELLER_TOKEN;
      } else if (role === 'delivery') {
        tokenKey = Config.STORAGE_KEYS.DELIVERY_TOKEN;
      }
      await AsyncStorage.setItem(tokenKey, String(newToken));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Update stored refresh token (e.g. after silent refresh token rotation)
   */
  async updateRefreshToken(newRefreshToken) {
    try {
      if (!newRefreshToken) return false;
      const role = await safeGetItem(Config.STORAGE_KEYS.USER_ROLE);
      let refreshKey = Config.STORAGE_KEYS.REFRESH_TOKEN;
      if (role === 'admin' || role === 'super_admin' || role === 'manager') {
        refreshKey = Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN;
      } else if (role === 'seller') {
        refreshKey = Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN;
      }
      await AsyncStorage.setItem(refreshKey, String(newRefreshToken));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Dedicated Admin Token Accessor (In-Memory Fast Path)
   */
  async getAdminToken() {
    try {
      const cached = getCachedToken(Config.STORAGE_KEYS.ADMIN_TOKEN);
      if (cached) return cached;
      const token = await safeGetItem(Config.STORAGE_KEYS.ADMIN_TOKEN);
      if (token) setCachedToken(Config.STORAGE_KEYS.ADMIN_TOKEN, token);
      return token;
    } catch (e) {
      return null;
    }
  },

  /**
   * Dedicated Admin Refresh Token Accessor
   */
  async getAdminRefreshToken() {
    try {
      return await safeGetItem(Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
    } catch (e) {
      return null;
    }
  },

  /**
   * Dedicated Admin Data Accessor
   */
  async getAdminData() {
    try {
      const dataStr = await safeGetItem(Config.STORAGE_KEYS.ADMIN_DATA);
      return dataStr ? JSON.parse(dataStr) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Save Admin Session Specifically
   */
  async saveAdminSession({ token, refreshToken, admin, remember = true }) {
    try {
      const itemsToSet = [
        [Config.STORAGE_KEYS.ADMIN_TOKEN, token || ''],
        [Config.STORAGE_KEYS.USER_ROLE, 'admin'],
        [Config.STORAGE_KEYS.REMEMBER_LOGIN, remember ? 'true' : 'false'],
      ];
      if (refreshToken) {
        itemsToSet.push([Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken]);
      }
      if (admin) {
        itemsToSet.push([Config.STORAGE_KEYS.ADMIN_DATA, JSON.stringify(admin)]);
      }
      await safeSetItems(itemsToSet);
      // Synchronize in-memory cache
      setCachedToken(Config.STORAGE_KEYS.ADMIN_TOKEN, token);
      if (refreshToken) setCachedToken(Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken);
      setCachedToken(Config.STORAGE_KEYS.USER_ROLE, 'admin');
      memoryCache.session = null; // Invalidate to rebuild cleanly
      return true;
    } catch (e) {
      console.warn('Error saving admin session to secure storage:', e);
      return false;
    }
  },

  /**
   * Update Stored Admin Access Token
   */
  async updateAdminAccessToken(newToken) {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(Config.STORAGE_KEYS.ADMIN_TOKEN, String(newToken));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Clear Dedicated Admin Session
   */
  async clearAdminSession() {
    try {
      await safeRemoveItems([
        Config.STORAGE_KEYS.ADMIN_TOKEN,
        Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN,
        Config.STORAGE_KEYS.ADMIN_DATA,
      ]);
      const currentRole = await safeGetItem(Config.STORAGE_KEYS.USER_ROLE);
      if (currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'manager') {
        await safeRemoveItems([Config.STORAGE_KEYS.USER_ROLE]);
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Dedicated Seller Token Accessor (In-Memory Fast Path)
   */
  async getSellerToken() {
    try {
      const cached = getCachedToken(Config.STORAGE_KEYS.SELLER_TOKEN);
      if (cached) return cached;
      const token = await safeGetItem(Config.STORAGE_KEYS.SELLER_TOKEN);
      if (token) setCachedToken(Config.STORAGE_KEYS.SELLER_TOKEN, token);
      return token;
    } catch (e) {
      return null;
    }
  },

  /**
   * Dedicated Seller Refresh Token Accessor
   */
  async getSellerRefreshToken() {
    try {
      return (
        (await safeGetItem(Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN)) ||
        (await safeGetItem(Config.STORAGE_KEYS.REFRESH_TOKEN))
      );
    } catch (e) {
      return null;
    }
  },

  /**
   * Dedicated Delivery Token Accessor (In-Memory Fast Path)
   */
  async getDeliveryToken() {
    try {
      const cached = getCachedToken(Config.STORAGE_KEYS.DELIVERY_TOKEN);
      if (cached) return cached;
      const token = await safeGetItem(Config.STORAGE_KEYS.DELIVERY_TOKEN);
      if (token) setCachedToken(Config.STORAGE_KEYS.DELIVERY_TOKEN, token);
      return token;
    } catch (e) {
      return null;
    }
  },

  /**
   * Active App Mode (Dual Access: 'customer' | 'seller')
   */
  async getActiveAppMode() {
    try {
      const mode = await safeGetItem(Config.STORAGE_KEYS.ACTIVE_APP_MODE);
      return mode === 'seller' ? 'seller' : 'customer';
    } catch (e) {
      return 'customer';
    }
  },

  async setActiveAppMode(mode) {
    try {
      const target = mode === 'seller' ? 'seller' : 'customer';
      await AsyncStorage.setItem(Config.STORAGE_KEYS.ACTIVE_APP_MODE, target);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Clear all auth sessions (secure logout)
   */
  async clearAuthSession() {
    try {
      clearMemoryCache();
      await safeRemoveItems([
        Config.STORAGE_KEYS.USER_TOKEN,
        Config.STORAGE_KEYS.REFRESH_TOKEN,
        Config.STORAGE_KEYS.USER_DATA,
        Config.STORAGE_KEYS.USER_ROLE,
        Config.STORAGE_KEYS.REMEMBER_LOGIN,
        Config.STORAGE_KEYS.ADMIN_TOKEN,
        Config.STORAGE_KEYS.ADMIN_REFRESH_TOKEN,
        Config.STORAGE_KEYS.ADMIN_DATA,
        Config.STORAGE_KEYS.SELLER_TOKEN,
        Config.STORAGE_KEYS.SELLER_REFRESH_TOKEN,
        Config.STORAGE_KEYS.SELLER_DATA,
        Config.STORAGE_KEYS.DELIVERY_TOKEN,
        Config.STORAGE_KEYS.DELIVERY_DATA,
        Config.STORAGE_KEYS.ACTIVE_APP_MODE,
      ]);
      return true;
    } catch (error) {
      console.warn('Error clearing auth session:', error);
      return false;
    }
  },
};

export default secureStorage;
