/**
 * Unified Seller Studio API Service for Bharat Bazaar Mobile App
 * Interfaces with backend /seller/* endpoints for:
 * Products, Inventory, Orders, Bulk Operations, Barcode Lookup,
 * Customer Messaging, Staff RBAC, Accounting, KYC, Automation & Growth.
 */
import api from './api.js';

export const sellerService = {
  // 1. Dashboard Analytics & Real-Time Stats
  async getDashboard() {
    try {
      const res = await api.get('/seller/dashboard');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 2. Product Catalog Management
  async getProducts(params = {}) {
    try {
      const res = await api.get('/seller/products', { params });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getProduct(id) {
    try {
      const res = await api.get(`/seller/products/${id}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async uploadProductImages(formData, onUploadProgress) {
    try {
      const res = await api.post('/seller/products/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000,
        onUploadProgress,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async createProduct(data) {
    try {
      const res = await api.post('/seller/products', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateProduct(id, data) {
    try {
      const res = await api.put(`/seller/products/${id}`, data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async deleteProduct(id) {
    try {
      const res = await api.delete(`/seller/products/${id}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async submitProductForApproval(id) {
    try {
      const res = await api.patch(`/seller/products/${id}/submit`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getCategories() {
    try {
      const res = await api.get('/seller/categories');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 3. Warehouse Inventory & Barcode Lookup
  async getInventory() {
    try {
      const res = await api.get('/seller/inventory');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async adjustStock({ productId, quantity, type, reason }) {
    try {
      const res = await api.post('/seller/inventory/adjust', {
        productId,
        quantity,
        type,
        reason,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async lookupBarcode(code) {
    try {
      const res = await api.get(`/seller/products/lookup/${code}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async adjustStockByBarcode({ code, delta, reason }) {
    try {
      const res = await api.post('/seller/products/barcode-stock-adjust', {
        code,
        delta,
        reason,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 4. Order Management & Bulk Actions
  async getOrders(params = {}) {
    try {
      const res = await api.get('/seller/orders', { params });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getOrder(id) {
    try {
      const res = await api.get(`/seller/orders/${id}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateOrderStatus(id, status, notes = '', rejectionReason = '') {
    try {
      const res = await api.patch(`/seller/orders/${id}/status`, { status, notes, rejectionReason });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async acceptOrder(id) {
    try {
      const res = await api.post(`/seller/orders/${id}/accept`);
      return res.data || res;
    } catch (err) {
      // Fallback to patch status
      return this.updateOrderStatus(id, 'accepted');
    }
  },

  async rejectOrder(id, rejectionReason) {
    try {
      const res = await api.post(`/seller/orders/${id}/reject`, { rejectionReason });
      return res.data || res;
    } catch (err) {
      // Fallback to patch status
      return this.updateOrderStatus(id, 'rejected', '', rejectionReason);
    }
  },

  // 4b. Pan-India Delivery Partner Assignment
  async getEligibleDeliveryPartners(params = {}) {
    try {
      const res = await api.get('/seller/delivery/eligible-partners', { params });
      return res.data?.partners || res.partners || res.data || [];
    } catch (err) {
      throw err;
    }
  },

  async assignDeliveryPartner({ orderId, deliveryPartnerId, specialInstructions = '' }) {
    try {
      const res = await api.post('/seller/delivery/assign', {
        orderId,
        deliveryPartnerId,
        specialInstructions,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getOrderDeliveryAssignments(orderId) {
    try {
      const res = await api.get(`/seller/delivery/assignments/${orderId}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async reassignDeliveryPartner(assignmentId, newDeliveryPartnerId) {
    try {
      const res = await api.post(`/seller/delivery/assignments/${assignmentId}/reassign`, {
        newDeliveryPartnerId,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async cancelDeliveryAssignment(assignmentId) {
    try {
      const res = await api.post(`/seller/delivery/assignments/${assignmentId}/cancel`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async bulkUpdateOrders(orderIds, action) {
    try {
      const res = await api.post('/seller/orders/bulk-update', { orderIds, action });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 5. Customer Messaging & Quick Replies
  async getOrderMessages(orderId) {
    try {
      const res = await api.get(`/seller/communication/orders/${orderId}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async sendOrderMessage(orderId, text, quickReplyKey = null) {
    try {
      const res = await api.post(`/seller/communication/orders/${orderId}`, {
        text,
        quickReplyKey,
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getQuickReplies() {
    try {
      const res = await api.get('/seller/communication/quick-replies');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 6. Staff & Attendance
  async getStaff() {
    try {
      const res = await api.get('/seller/staff');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async inviteStaff(data) {
    try {
      const res = await api.post('/seller/staff', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateStaffStatus(id, status) {
    try {
      const res = await api.patch(`/seller/staff/${id}/status`, { status });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async recordStaffAttendance(id, shiftType, action) {
    try {
      const res = await api.post(`/seller/staff/${id}/attendance`, { shiftType, action });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async deleteStaff(id) {
    try {
      const res = await api.delete(`/seller/staff/${id}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 7. GST Accounting & Settlements
  async getGstReport(month = null, year = null) {
    try {
      const res = await api.get('/seller/accounting/gst-report', {
        params: { month, year },
      });
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getSettlements() {
    try {
      const res = await api.get('/seller/accounting/settlements');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 8. Store Automation & Delivery Zones
  async getStoreAutomation() {
    try {
      const res = await api.get('/seller/automation');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateStoreAutomation(data) {
    try {
      const res = await api.put('/seller/automation', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async getDeliveryZones() {
    try {
      const res = await api.get('/seller/automation/delivery-zones');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateDeliveryZones(data) {
    try {
      const res = await api.put('/seller/automation/delivery-zones', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 9. Seller Protection & Disputes
  async getDisputes() {
    try {
      const res = await api.get('/seller/disputes');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async createDispute(data) {
    try {
      const res = await api.post('/seller/disputes', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 10. Growth, Coupons & AI Studio
  async getCampaigns() {
    try {
      const res = await api.get('/seller/growth/coupons');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async createCoupon(data) {
    try {
      const res = await api.post('/seller/growth/coupons', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async generateAiCopy(data) {
    try {
      const res = await api.post('/seller/growth/ai-copy', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  // 11. KYC & Business Verification
  async getKycStatus() {
    try {
      const res = await api.get('/seller/verification/status');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async updateKyc(data) {
    try {
      const res = await api.put('/seller/verification/kyc', data);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },

  async submitKycForReview() {
    try {
      const res = await api.post('/seller/verification/submit');
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },
};

export default sellerService;
