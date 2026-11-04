import api from './api';

export const reviewService = {
  /**
   * Get reviews for a specific product
   */
  async getProductReviews(productId, page = 1) {
    try {
      const response = await api.get(`/reviews/product/${productId}?page=${page}`);
      return response.data || { reviews: [], stats: { averageRating: 4.8, totalReviews: 0, breakdown: {} } };
    } catch (e) {
      return { reviews: [], stats: { averageRating: 4.8, totalReviews: 0, breakdown: {} } };
    }
  },

  /**
   * Check if current user is eligible to review
   */
  async checkEligibility(productId) {
    try {
      const response = await api.get(`/reviews/check-eligibility/${productId}`);
      return response.data || { eligible: false, hasReviewed: false };
    } catch (e) {
      return { eligible: false, hasReviewed: false };
    }
  },

  /**
   * Submit or update a review
   */
  async submitReview(reviewData) {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  /**
   * Report an inappropriate review
   */
  async reportReview(reviewId, reason) {
    const response = await api.post(`/reviews/${reviewId}/report`, { reason });
    return response.data;
  },
};

export default reviewService;

