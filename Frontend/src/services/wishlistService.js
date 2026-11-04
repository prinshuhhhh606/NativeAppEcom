/**
 * Wishlist Service
 * Communicates with backend wishlist API with unified response unwrapping
 */
import api from './api';

export const wishlistService = {
  async getWishlist() {
    try {
      const response = await api.get('/wishlist');
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },

  async addToWishlist(productId) {
    try {
      const response = await api.post('/wishlist/add', { productId });
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },

  async removeFromWishlist(productId) {
    try {
      const response = await api.delete(`/wishlist/remove/${productId}`);
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },

  async toggleWishlist(productId) {
    try {
      const response = await api.post('/wishlist/toggle', { productId });
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },

  async syncWishlist(productIds) {
    try {
      const response = await api.post('/wishlist/sync', { productIds });
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },

  async moveToCart(productId) {
    try {
      const response = await api.post(`/wishlist/move-to-cart/${productId}`);
      return response?.data !== undefined ? response.data : response;
    } catch (e) {
      throw e;
    }
  },
};

export default wishlistService;

