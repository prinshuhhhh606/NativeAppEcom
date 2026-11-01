import api from './api';

export const sellerService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),

  // Verification & KYC
  getVerificationStatus: () => api.get('/verification/status'),
  updateKyc: (data) => api.put('/verification/kyc', data),
  submitForReview: () => api.post('/verification/submit'),

  // Dashboard Overview
  getDashboardOverview: () => api.get('/dashboard/overview'),

  // Product Catalog
  getProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Inventory Management
  getInventory: (params = {}) => api.get('/inventory', { params }),
  adjustStock: (data) => api.post('/inventory/adjust', data),

  // Orders & Fulfillment
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status, notes = '') => api.put(`/orders/${id}/status`, { status, notes }),
  updateTracking: (id, data) => api.put(`/orders/${id}/tracking`, data),

  // Financial Earnings & Ledger
  getEarningsSummary: () => api.get('/earnings/summary'),
  getLedger: (params = {}) => api.get('/earnings/ledger', { params }),

  // Bank Payouts
  getPayouts: (params = {}) => api.get('/payouts', { params }),
  requestPayout: (amount, notes = '') => api.post('/payouts/request', { amount, notes }),

  // Returns & Replacements
  getReturns: (params = {}) => api.get('/returns', { params }),
  processReturn: (id, data) => api.put(`/returns/${id}/process`, data),

  // Customer Reviews
  getReviews: (params = {}) => api.get('/reviews', { params }),
  replyToReview: (id, replyText) => api.post(`/reviews/${id}/reply`, { replyText }),

  // Notifications
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),

  // Analytics & Reports
  getSalesReport: (params = {}) => api.get('/reports/sales', { params }),
  getProductsReport: (params = {}) => api.get('/reports/products', { params }),
  getInventoryReport: () => api.get('/reports/inventory'),

  // Delivery Partner Fleet Assignment
  getEligibleDeliveryPartners: (params = {}) => api.get('/delivery/eligible-partners', { params }),
  assignDeliveryPartner: (data) => api.post('/delivery/assign', data),
  getOrderDeliveryAssignment: (orderId) => api.get(`/delivery/assignments/${orderId}`),
  cancelDeliveryAssignment: (assignmentId) => api.post(`/delivery/assignments/${assignmentId}/cancel`),
  reassignDeliveryPartner: (assignmentId, newDeliveryPartnerId) =>
    api.post(`/delivery/assignments/${assignmentId}/reassign`, { newDeliveryPartnerId }),
};

export default sellerService;

