import api from './api';

export const questionService = {
  /**
   * Get Q&A for a product
   */
  async getProductQuestions(productId, page = 1) {
    try {
      const response = await api.get(`/questions/product/${productId}?page=${page}`);
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Ask a question about a product
   */
  async askQuestion(productId, question) {
    const response = await api.post('/questions', { productId, question });
    return response.data;
  },

  /**
   * Report an inappropriate question
   */
  async reportQuestion(questionId, reason) {
    const response = await api.post(`/questions/${questionId}/report`, { reason });
    return response.data;
  },
};

export default questionService;

