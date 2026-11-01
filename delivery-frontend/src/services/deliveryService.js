import api from './api';

export const deliveryService = {
  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  sendOtp: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),

  // Availability & Dashboard
  updateAvailability: (availability) => api.post('/availability', { availability }),
  getDashboard: () => api.get('/dashboard'),

  // Assignment Requests (Accept / Decline)
  getRequests: () => api.get('/requests'),
  acceptRequest: (assignmentId) => api.post(`/requests/${assignmentId}/accept`),
  declineRequest: (assignmentId, reason) => api.post(`/requests/${assignmentId}/decline`, { reason }),

  // Deliveries Workflow
  getActiveDeliveries: () => api.get('/deliveries/active'),
  getDeliveryDetails: (deliveryId) => api.get(`/deliveries/${deliveryId}`),
  reachedPickup: (deliveryId) => api.post(`/deliveries/${deliveryId}/reached-pickup`),
  verifyPickupOtp: (deliveryId, otp) => api.post(`/deliveries/${deliveryId}/verify-pickup-otp`, { otp }),
  outForDelivery: (deliveryId) => api.post(`/deliveries/${deliveryId}/out-for-delivery`),
  reachedCustomer: (deliveryId) => api.post(`/deliveries/${deliveryId}/reached-customer`),
  verifyDeliveryOtp: (deliveryId, data) => api.post(`/deliveries/${deliveryId}/verify-delivery-otp`, data),
  reportFailure: (deliveryId, data) => api.post(`/deliveries/${deliveryId}/failure`, data),

  // Live Location
  updateLocation: (coords) => api.post('/location', coords),

  // Earnings & Payouts
  getEarnings: () => api.get('/earnings'),
  getEarningsHistory: () => api.get('/earnings/history'),
  getPayouts: () => api.get('/payouts'),
  requestPayout: (data) => api.post('/payouts/request', data),

  // History & Notifications
  getHistory: (params = {}) => api.get('/deliveries/history', { params }),
  getNotifications: () => api.get('/notifications'),
};

export default deliveryService;

