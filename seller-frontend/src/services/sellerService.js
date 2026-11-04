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

  // Categories
  getCategories: () => api.get('/categories'),

  // Product Catalog
  getProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  submitProductForApproval: (id) => api.patch(`/products/${id}/submit`),
  uploadProductImages: (formData) =>
    api.post('/products/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Inventory Management
  getInventory: (params = {}) => api.get('/inventory', { params }),
  adjustStock: (data) => api.post('/inventory/adjust', data),

  // Orders & Fulfillment Lifecycle
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getOrderStatistics: () => api.get('/orders/statistics'),
  updateOrderStatus: (id, statusOrData, notes = '') => {
    const payload = typeof statusOrData === 'object'
      ? statusOrData
      : { status: statusOrData, notes, reason: notes };
    return api.put(`/orders/${id}/status`, payload);
  },
  updateTracking: (id, data) => api.put(`/orders/${id}/tracking`, data),
  generateShippingLabel: (id, data) => api.post(`/orders/${id}/shipping-label`, data),
  schedulePickup: (id, data) => api.post(`/orders/${id}/schedule-pickup`, data),
  cancelShipment: (id, data) => api.post(`/orders/${id}/cancel-shipment`, data),
  getOrderInvoice: (id) => api.get(`/orders/${id}/invoice`),

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

  // Barcode & QR Stock Scanning (Section A)
  lookupProductByBarcode: (code) => api.get(`/products/lookup/${code}`),
  adjustStockByBarcode: (data) => api.post('/products/barcode-stock-adjust', data),

  // Bulk Order Operations (Section B)
  bulkUpdateOrders: (data) => api.post('/orders/bulk-update', data),
  bulkGetInvoices: (data) => api.post('/orders/bulk-invoices', data),

  // Staff & Employee Management (Section C)
  getStaff: () => api.get('/staff'),
  inviteStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.put(`/staff/${id}`, data),
  toggleStaffStatus: (id) => api.patch(`/staff/${id}/status`),
  recordAttendance: (id, data) => api.post(`/staff/${id}/attendance`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),

  // Customer Communication (Section E)
  getQuickReplies: () => api.get('/communication/quick-replies'),
  getOrderMessages: (orderId) => api.get(`/communication/orders/${orderId}`),
  sendOrderMessage: (orderId, data) => api.post(`/communication/orders/${orderId}`, data),

  // Store Automation & Delivery Zones (Sections G, I, J)
  getStoreAutomation: () => api.get('/automation'),
  updateStoreAutomation: (data) => api.put('/automation', data),
  getDeliveryZones: () => api.get('/automation/delivery-zones'),
  updateDeliveryZones: (data) => api.put('/automation/delivery-zones', data),

  // GST & Accounting Center (Section D)
  getGstTaxReport: (params = {}) => api.get('/accounting/gst-report', { params }),
  getSettlements: () => api.get('/accounting/settlements'),

  // Seller Protection & Disputes (Section K)
  getDisputes: () => api.get('/disputes'),
  createDispute: (data) => api.post('/disputes', data),
  getSecurityOverview: () => api.get('/disputes/security-overview'),

  // Business Growth Center (Section L)
  getCampaigns: () => api.get('/growth/coupons'),
  createCoupon: (data) => api.post('/growth/coupons', data),
  generateAiCopy: (data) => api.post('/growth/ai-copy', data),
};

export default sellerService;

