/**
 * Cart Service for Appsica / Bharat Bazaar
 * Handles customer cart synchronization, guest cart merge, and server-side cart operations.
 */
import api from './api';

export const cartService = {
  /**
   * Fetch current user's cart from backend
   */
  async getCart() {
    try {
      const response = await api.get('/cart');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Merge guest items into authenticated user's cart
   * @param {Array} guestItems - [{ productId, quantity, selectedVariant, price }]
   */
  async mergeCart(guestItems) {
    try {
      const payload = {
        items: (guestItems || []).map((item) => ({
          productId: item.id || item._id,
          quantity: item.quantity || 1,
          selectedVariant: item.selectedVariant || item.variant || {},
          price: Number(item.price) || 0,
        })),
      };
      const response = await api.post('/cart/merge', payload);
      return response.data || response;
    } catch (error) {
      console.warn('Cart merge request error:', error?.message);
      throw error;
    }
  },

  /**
   * Add item to server cart
   */
  async addToCart(productId, quantity = 1, variant = {}) {
    try {
      const response = await api.post('/cart/add', {
        productId,
        quantity,
        variant,
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update item quantity on server cart
   */
  async updateQuantity(itemId, quantity) {
    try {
      const response = await api.put(`/cart/item/${itemId}`, { quantity });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove item from server cart
   */
  async removeFromCart(itemId) {
    try {
      const response = await api.delete(`/cart/item/${itemId}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clear user's server cart
   */
  async clearCart() {
    try {
      const response = await api.delete('/cart/clear');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Apply coupon to server cart
   */
  async applyCoupon(code) {
    try {
      const response = await api.post('/cart/apply-coupon', { code });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove coupon from server cart
   */
  async removeCoupon() {
    try {
      const response = await api.delete('/cart/remove-coupon');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};

export default cartService;

