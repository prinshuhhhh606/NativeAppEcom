/**
 * Wishlist Context
 * State management for customer wishlist and favorites
 * Supports local storage caching and automatic backend sync for authenticated users.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { useAuth } from './AuthContext';
import { useActionFeedback } from './ActionFeedbackContext';
import wishlistService from '../services/wishlistService';

export const WishlistContext = createContext();

const normalizeProduct = (p) => {
  if (!p) return null;
  const id = p._id?.toString() || p.id?.toString() || '';
  return {
    ...p,
    id,
    _id: id,
    name: p.productName || p.name || 'Handcrafted Product',
    price: Number(p.price || p.sellingPrice || 0),
    originalPrice: Number(p.originalPrice || p.mrp || p.price || 0),
    discountPercent: Number(p.discountPercent || 0),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image].filter(Boolean),
  };
};

const extractProductsArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.products)) return res.products;
  return [];
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showWishlistSuccess, showError } = useActionFeedback();
  const prevAuthRef = useRef(isAuthenticated);
  const isSyncingRef = useRef(false);
  const hasInitialSyncedRef = useRef(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(Config.STORAGE_KEYS.WISHLIST_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistItems(parsed.map(normalizeProduct).filter(Boolean));
        }
      }
    } catch (e) {
      console.warn('[Wishlist] Error reading local cache', e);
    }
  };

  const saveWishlist = async (items) => {
    try {
      await AsyncStorage.setItem(
        Config.STORAGE_KEYS.WISHLIST_ITEMS,
        JSON.stringify(items)
      );
    } catch (e) {
      console.warn('[Wishlist] Error persisting items locally', e);
    }
  };

  /**
   * Sync wishlist with backend when user is authenticated
   */
  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsLoading(true);

    try {
      const stored = await AsyncStorage.getItem(Config.STORAGE_KEYS.WISHLIST_ITEMS);
      const localItems = stored ? JSON.parse(stored) : [];
      const productIds = localItems
        .map((p) => (p?._id || p?.id)?.toString())
        .filter(Boolean);

      let serverItems = null;

      // 1. If we have local guest items, sync with user account
      if (productIds.length > 0) {
        try {
          const res = await wishlistService.syncWishlist(productIds);
          serverItems = extractProductsArray(res);
        } catch (syncErr) {
          console.warn('[Wishlist] Sync attempt failed, falling back to fetch:', syncErr.message || syncErr);
        }
      }

      // 2. If no server items returned from sync, fetch fresh wishlist from server
      if (serverItems === null) {
        try {
          const remote = await wishlistService.getWishlist();
          serverItems = extractProductsArray(remote);
        } catch (fetchErr) {
          console.warn('[Wishlist] Fetch wishlist failed:', fetchErr.message || fetchErr);
        }
      }

      // 3. Normalize and update state if server items retrieved
      if (Array.isArray(serverItems)) {
        const normalized = serverItems.map(normalizeProduct).filter(Boolean);
        setWishlistItems(normalized);
        saveWishlist(normalized);
      } else if (localItems.length > 0) {
        // Offline / server unreachable fallback: retain local cached items
        const normalized = localItems.map(normalizeProduct).filter(Boolean);
        setWishlistItems(normalized);
      }
    } catch (e) {
      console.warn('[Wishlist] Failed to sync wishlist with backend:', e.message || e);
    } finally {
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasInitialSyncedRef.current || !prevAuthRef.current) {
        hasInitialSyncedRef.current = true;
        syncWithBackend();
      }
    } else if (prevAuthRef.current && !isAuthenticated) {
      // User logged out: clear wishlist state
      setWishlistItems([]);
      AsyncStorage.removeItem(Config.STORAGE_KEYS.WISHLIST_ITEMS).catch(() => {});
      hasInitialSyncedRef.current = false;
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, syncWithBackend]);

  // Fast O(1) set lookup for wishlist status across all product cards
  const wishlistIdSet = useMemo(() => {
    return new Set(wishlistItems.map((item) => (item.id || item._id)?.toString()).filter(Boolean));
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistIdSet.has(productId.toString());
    },
    [wishlistIdSet]
  );

  const addToWishlist = useCallback(
    async (product) => {
      if (!product) return;
      const prodId = (product.id || product._id)?.toString();
      if (!prodId) return;

      setWishlistItems((prev) => {
        if (prev.some((item) => (item.id || item._id)?.toString() === prodId)) {
          return prev;
        }
        const normalized = normalizeProduct(product);
        const updated = [normalized, ...prev];
        saveWishlist(updated);
        return updated;
      });

      if (isAuthenticated) {
        try {
          const res = await wishlistService.addToWishlist(prodId);
          const serverList = extractProductsArray(res);
          if (Array.isArray(serverList) && serverList.length > 0) {
            const normalized = serverList.map(normalizeProduct).filter(Boolean);
            setWishlistItems(normalized);
            saveWishlist(normalized);
          }
        } catch (err) {
          console.warn('[Wishlist] Remote addToWishlist failed:', err.message || err);
        }
      }
    },
    [isAuthenticated]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      const targetId = productId.toString();

      setWishlistItems((prev) => {
        const updated = prev.filter(
          (item) => (item.id || item._id)?.toString() !== targetId
        );
        saveWishlist(updated);
        return updated;
      });

      if (isAuthenticated) {
        try {
          const res = await wishlistService.removeFromWishlist(targetId);
          const serverList = extractProductsArray(res);
          if (Array.isArray(serverList)) {
            const normalized = serverList.map(normalizeProduct).filter(Boolean);
            setWishlistItems(normalized);
            saveWishlist(normalized);
          }
        } catch (err) {
          console.warn('[Wishlist] Remote removeFromWishlist failed:', err.message || err);
        }
      }
    },
    [isAuthenticated]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!product) return false;
      const prodId = (product.id || product._id)?.toString();
      if (!prodId) return false;

      if (isInWishlist(prodId)) {
        await removeFromWishlist(prodId);
        showWishlistSuccess({ product, isAdded: false });
        return false;
      } else {
        await addToWishlist(product);
        showWishlistSuccess({ product, isAdded: true });
        return true;
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist, showWishlistSuccess]
  );

  const moveToCart = useCallback(
    async (productId) => {
      if (!productId) return false;
      const targetId = productId.toString();
      try {
        if (isAuthenticated) {
          await wishlistService.moveToCart(targetId);
        }
        setWishlistItems((prev) => {
          const updated = prev.filter((item) => (item.id || item._id)?.toString() !== targetId);
          saveWishlist(updated);
          return updated;
        });
        return true;
      } catch (err) {
        console.warn('[Wishlist] moveToCart failed:', err.message || err);
        return false;
      }
    },
    [isAuthenticated]
  );

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems.length]);

  const contextValue = useMemo(
    () => ({
      wishlistItems,
      wishlistCount,
      isLoading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      moveToCart,
      syncWithBackend,
    }),
    [
      wishlistItems,
      wishlistCount,
      isLoading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      moveToCart,
      syncWithBackend,
    ]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
export default WishlistContext;
