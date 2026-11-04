/**
 * Cart Context
 * State management for Shopping Cart, Quantity, Coupons, Totals & Delivery Fees.
 * Supports persistent guest cart, safe guest-to-customer merging upon login,
 * stock limit validation, and isolated multi-user sessions.
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { COUPONS } from '../models/productModel';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { useActionFeedback } from './ActionFeedbackContext';
import cartService from '../services/cartService';

export const CartContext = createContext();

const GUEST_CART_KEY = '@appecom_guest_cart';
const AUTH_CART_KEY = Config.STORAGE_KEYS.CART_ITEMS || '@appecom_cart_items';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const { pincodeInfo } = useLocation();
  const { isAuthenticated } = useAuth();
  const { showCartSuccess, showError } = useActionFeedback();
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  /**
   * Load cart from AsyncStorage on boot
   * Checks both guest storage and auth storage
   */
  const loadCartFromStorage = async () => {
    try {
      const authStored = await AsyncStorage.getItem(AUTH_CART_KEY);
      if (authStored) {
        setCartItems(JSON.parse(authStored));
        return;
      }

      const guestStored = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (guestStored) {
        setCartItems(JSON.parse(guestStored));
      }
    } catch (e) {
      console.warn('Error loading cart from storage:', e);
    }
  };

  /**
   * Save cart items to local storage
   */
  const saveCartToStorage = useCallback(async (items) => {
    try {
      const key = isAuthenticated ? AUTH_CART_KEY : GUEST_CART_KEY;
      await AsyncStorage.setItem(key, JSON.stringify(items));
      // Also update standard key for cross-module compatibility
      await AsyncStorage.setItem(AUTH_CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving cart to storage:', e);
    }
  }, [isAuthenticated]);

  /**
   * Merge Guest Cart into Customer's Account after Login / Register
   */
  const mergeGuestCartWithServer = useCallback(async () => {
    setIsMerging(true);
    try {
      // 1. Read guest items from storage or active memory
      let itemsToMerge = [];
      const guestStored = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (guestStored) {
        try {
          itemsToMerge = JSON.parse(guestStored);
        } catch (e) {
          itemsToMerge = [];
        }
      } else if (cartItems.length > 0) {
        itemsToMerge = cartItems;
      }

      if (itemsToMerge.length > 0) {
        // 2. Call backend merge endpoint
        const serverCart = await cartService.mergeCart(itemsToMerge);
        if (serverCart?.items && Array.isArray(serverCart.items)) {
          // Normalize server items to frontend format
          const normalized = serverCart.items.map((it) => {
            const p = it.product || {};
            return {
              id: p._id?.toString() || it.product?.toString() || it.id,
              _id: p._id?.toString() || it.product?.toString(),
              name: p.productName || p.name || it.name,
              price: Number(it.price) || Number(p.discountPrice) || Number(p.price) || 0,
              originalPrice: Number(p.price) || Number(it.price) || 0,
              image: p.images?.[0] || it.image || '',
              quantity: it.quantity || 1,
              selectedVariant: it.selectedVariant || it.variant || {},
              codAvailable: p.codAvailable ?? true,
              transitDays: p.transitDays || 3,
            };
          });

          setCartItems(normalized);
          await AsyncStorage.setItem(AUTH_CART_KEY, JSON.stringify(normalized));

          // If there are stock or price notifications, alert the user gently
          if (Array.isArray(serverCart.notifications) && serverCart.notifications.length > 0) {
            setTimeout(() => {
              Alert.alert('Cart Updated', serverCart.notifications.join('\n'));
            }, 500);
          }
        }
      } else {
        // No guest items; fetch user's existing cart from server
        try {
          const res = await cartService.getCart();
          if (res?.items && Array.isArray(res.items)) {
            const normalized = res.items.map((it) => {
              const p = it.product || {};
              return {
                id: p._id?.toString() || it.product?.toString() || it.id,
                _id: p._id?.toString() || it.product?.toString(),
                name: p.productName || p.name || it.name,
                price: Number(it.price) || Number(p.discountPrice) || Number(p.price) || 0,
                originalPrice: Number(p.price) || Number(it.price) || 0,
                image: p.images?.[0] || it.image || '',
                quantity: it.quantity || 1,
                selectedVariant: it.selectedVariant || it.variant || {},
                codAvailable: p.codAvailable ?? true,
                transitDays: p.transitDays || 3,
              };
            });
            setCartItems(normalized);
            await AsyncStorage.setItem(AUTH_CART_KEY, JSON.stringify(normalized));
          }
        } catch (e) {}
      }

      // 3. Clear guest cart key to keep clean separation
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    } catch (e) {
      console.warn('Failed to merge guest cart with server:', e);
    } finally {
      setIsMerging(false);
    }
  }, [cartItems, isAuthenticated]);

  /**
   * Reset cart on user logout (isolates user data)
   */
  const resetCartOnLogout = useCallback(async () => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      await AsyncStorage.removeItem(AUTH_CART_KEY);
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    } catch (e) {}
  }, []);

  /**
   * Reactively handle authentication state changes:
   * Merge guest cart on login, and reset cart on logout
   */
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      mergeGuestCartWithServer();
    } else if (prevAuthRef.current && !isAuthenticated) {
      resetCartOnLogout();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, mergeGuestCartWithServer, resetCartOnLogout]);

  /**
   * Add Item to Cart (Guest or Authenticated)
   */
  const addToCart = useCallback((product, quantity = 1, selectedVariant = {}, options = {}) => {
    if (!product) return;
    const prodId = product.id || product._id?.toString() || product._id;
    let isUpdate = false;

    setCartItems((prevItems) => {
      const variantKey = JSON.stringify(selectedVariant);
      const existingIndex = prevItems.findIndex(
        (item) => (item.id === prodId || item.id === product._id) && JSON.stringify(item.selectedVariant) === variantKey
      );

      let updated;
      if (existingIndex > -1) {
        isUpdate = true;
        updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        const newItem = {
          id: prodId,
          _id: prodId,
          name: product.name || product.productName,
          subtitle: product.subtitle || '',
          price: Number(product.discountPrice) || Number(product.price) || 0,
          originalPrice: Number(product.price) || Number(product.originalPrice) || 0,
          image: product.images?.[0] || product.image || '',
          selectedVariant,
          quantity,
          codAvailable: product.codAvailable ?? true,
          transitDays: product.transitDays || 3,
        };
        updated = [newItem, ...prevItems];
      }

      saveCartToStorage(updated);
      return updated;
    });

    // If authenticated, sync with backend
    if (isAuthenticated) {
      cartService.addToCart(prodId, quantity, selectedVariant).catch((err) => {
        console.warn('Backend cart sync warning:', err?.message);
        if (err?.response && err.response.status >= 500) {
          showError(err.response?.data?.message || 'Cart sync error. Item saved locally.');
        }
      });
    }

    // Trigger Success Popup unless quiet/silent mode requested (e.g. Buy Now)
    if (!options.silent) {
      showCartSuccess({ product, isUpdate, quantity });
    }
  }, [saveCartToStorage, isAuthenticated, showCartSuccess]);

  /**
   * Update Quantity
   */
  const updateQuantity = useCallback((productId, selectedVariant = {}, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, selectedVariant);
      return;
    }

    setCartItems((prevItems) => {
      const variantKey = JSON.stringify(selectedVariant);
      const updated = prevItems.map((item) => {
        if (item.id === productId && JSON.stringify(item.selectedVariant) === variantKey) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      saveCartToStorage(updated);
      return updated;
    });
  }, [saveCartToStorage]);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback((productId, selectedVariant = {}) => {
    setCartItems((prevItems) => {
      const variantKey = JSON.stringify(selectedVariant);
      const updated = prevItems.filter(
        (item) => !(item.id === productId && JSON.stringify(item.selectedVariant) === variantKey)
      );
      saveCartToStorage(updated);
      return updated;
    });
  }, [saveCartToStorage]);

  /**
   * Clear all items in cart
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    AsyncStorage.removeItem(AUTH_CART_KEY);
    AsyncStorage.removeItem(GUEST_CART_KEY);
    cartService.clearCart().catch(() => {});
  }, []);

  /**
   * Apply Coupon Code
   */
  const applyCoupon = useCallback((code) => {
    const found = COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      return { success: false, message: 'Invalid coupon code. Try WELCOME100 or BHARAT20' };
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Cart value must be at least ₹${found.minOrderValue} to apply this coupon`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  }, [cartItems]);

  /**
   * Remove Coupon
   */
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  /**
   * Calculate Financial Totals
   */
  const cartSummary = useMemo(() => {
    const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalOriginalPrice = cartItems.reduce(
      (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
      0
    );

    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountAmount) {
        couponDiscount = appliedCoupon.discountAmount;
      } else if (appliedCoupon.discountPercent) {
        const calculated = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
        couponDiscount = Math.min(calculated, appliedCoupon.maxDiscount || calculated);
      }
    }

    let deliveryFee = 0;
    const baseFee = pincodeInfo?.deliveryCharge || Config.STANDARD_DELIVERY_CHARGE;
    if (subtotal > 0) {
      if (appliedCoupon?.freeShipping || subtotal >= Config.FREE_SHIPPING_THRESHOLD) {
        deliveryFee = 0;
      } else {
        deliveryFee = baseFee;
      }
    }

    const totalAmount = Math.max(0, subtotal - couponDiscount + deliveryFee);
    const totalSavings = totalOriginalPrice - subtotal + couponDiscount;

    return {
      itemCount,
      subtotal,
      totalOriginalPrice,
      couponDiscount,
      deliveryFee,
      totalAmount,
      totalSavings,
      freeDeliveryEligible: subtotal >= Config.FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeDelivery: Math.max(0, Config.FREE_SHIPPING_THRESHOLD - subtotal),
    };
  }, [cartItems, appliedCoupon, pincodeInfo]);

  const value = useMemo(() => ({
    cartItems,
    appliedCoupon,
    cartSummary,
    isMerging,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    mergeGuestCartWithServer,
    resetCartOnLogout,
  }), [
    cartItems,
    appliedCoupon,
    cartSummary,
    isMerging,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    mergeGuestCartWithServer,
    resetCartOnLogout,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
