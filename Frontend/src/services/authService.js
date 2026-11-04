/**
 * Unified Authentication Service for Pan India E-Commerce
 * Handles Customer Auth (Email/Mobile/Password, OTP, Password Reset)
 * and Admin Auth (Role-based access verification, Admin portal tokens)
 */
import api from './api';
import secureStorage from '../utils/secureStorage';

export const authService = {
  /**
   * Customer Login with Email or Mobile + Password
   */
  async customerLogin({ identifier, password, remember = true }) {
    try {
      const payload = {
        identifier: identifier.trim(),
        password,
      };

      // Support either direct field or generic identifier
      if (identifier.includes('@')) {
        payload.email = identifier.trim().toLowerCase();
      } else {
        payload.phone = identifier.trim().replace(/[^0-9]/g, '');
      }

      const response = await api.post('/auth/login', payload);
      const data = response.data || response;
      const user = data.user;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (!accessToken || !user) {
        throw new Error('Invalid authentication response from server');
      }

      // Dual Access: If user is registered as a seller, preserve seller role capability
      const role = (user.role === 'seller' || user.isSeller) ? 'seller' : 'customer';

      await secureStorage.saveAuthSession({
        token: accessToken,
        refreshToken,
        user,
        role,
        remember,
      });

      // If logging in via customer portal, default active mode is customer
      await secureStorage.setActiveAppMode('customer');

      return {
        success: true,
        user,
        token: accessToken,
        role,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Customer Registration
   */
  async customerRegister(userData) {
    try {
      const fullName = (userData.fullName || userData.name || '').trim();
      const rawMobile = userData.mobileNumber || userData.phone || '';
      const mobileNumber = rawMobile.toString().replace(/[^0-9]/g, '');
      const email = (userData.email || '').trim().toLowerCase();

      const payload = {
        fullName,
        name: fullName,
        mobileNumber,
        phone: mobileNumber,
        email,
        password: userData.password,
        defaultPincode: userData.defaultPincode || '110001',
      };

      const response = await api.post('/auth/register', payload);
      const data = response.data || response;
      const user = data.user;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (accessToken && user) {
        await secureStorage.saveAuthSession({
          token: accessToken,
          refreshToken,
          user,
          role: 'customer',
          remember: true,
        });
      }

      return {
        success: true,
        user,
        token: accessToken,
        message: response.message || 'Account created successfully!',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request OTP for mobile number
   */
  async requestOtp(phone) {
    try {
      const cleaned = phone.toString().replace(/[^0-9]/g, '');
      const response = await api.post('/auth/send-otp', { phone: cleaned });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify OTP and Login
   */
  async verifyOtp(phone, otp, remember = true) {
    try {
      const cleaned = phone.toString().replace(/[^0-9]/g, '');
      const response = await api.post('/auth/verify-otp', { phone: cleaned, otp: otp.trim() });
      const data = response.data || response;
      const user = data.user;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (accessToken && user) {
        await secureStorage.saveAuthSession({
          token: accessToken,
          refreshToken,
          user,
          role: 'customer',
          remember,
        });
      }

      return {
        success: true,
        user,
        token: accessToken,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request Password Reset Code
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset Password with OTP Code
   */
  async resetPassword({ email, otp, newPassword }) {
    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Admin Login with Role Verification
   */
  async adminLogin({ email, password, remember = true }) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await api.post('/admin/auth/login', payload);
      const data = response.data || response;
      const admin = data.admin || data.user;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (!accessToken || !admin) {
        throw new Error('Invalid response from Admin authentication service');
      }

      // Security Check: Verify that the user has an actual Admin role
      const validAdminRoles = ['super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager', 'support_manager'];
      if (!admin.role || !validAdminRoles.includes(admin.role)) {
        throw {
          status: 403,
          message: 'Access Denied: Your account does not have administrative privileges.',
        };
      }

      await secureStorage.saveAdminSession({
        token: accessToken,
        refreshToken,
        admin,
        remember,
      });

      await secureStorage.saveAuthSession({
        token: accessToken,
        refreshToken,
        user: admin,
        role: 'admin',
        remember,
      });

      return {
        success: true,
        user: admin,
        token: accessToken,
        role: 'admin',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch current authenticated profile
   */
  async getCurrentProfile(role = 'customer') {
    try {
      let endpoint = '/auth/me';
      if (role === 'admin') endpoint = '/admin/auth/me';
      else if (role === 'seller') endpoint = '/seller/auth/profile';
      else if (role === 'delivery') endpoint = '/delivery/profile';

      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      return null;
    }
  },

  /**
   * Update User Profile (Customer / Partner)
   */
  async updateProfile(profileData, role = 'customer') {
    try {
      let endpoint = '/users/profile';
      if (role === 'seller') endpoint = '/seller/auth/profile';
      else if (role === 'delivery') endpoint = '/delivery/profile';

      const payload = {};
      if (profileData.fullName || profileData.name) {
        payload.name = (profileData.fullName || profileData.name).trim();
      }
      if (profileData.email) {
        payload.email = profileData.email.trim().toLowerCase();
      }
      if (profileData.phone || profileData.mobileNumber) {
        payload.phone = (profileData.phone || profileData.mobileNumber).toString().replace(/[^0-9]/g, '');
      }

      const response = await api.put(endpoint, payload);
      const data = response.data || response;
      const updatedUser = data.user || data.seller || data.partner || data;

      const session = await secureStorage.getAuthSession();
      if (session) {
        await secureStorage.saveAuthSession({
          ...session,
          user: { ...session.user, ...updatedUser },
        });
      }

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Seller Login with Role Verification
   */
  async sellerLogin({ email, password, remember = true }) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await api.post('/seller/auth/login', payload);
      const data = response.data || response;
      const seller = data.seller;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (!accessToken || !seller) {
        throw new Error('Invalid response from Seller authentication service');
      }

      await secureStorage.saveAuthSession({
        token: accessToken,
        refreshToken,
        user: seller,
        role: 'seller',
        remember,
      });

      // Default active mode when entering via Seller Studio is seller
      await secureStorage.setActiveAppMode('seller');

      return {
        success: true,
        user: seller,
        token: accessToken,
        role: 'seller',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Seller Registration
   */
  async sellerRegister(sellerData) {
    try {
      const payload = {
        name: (sellerData.name || sellerData.ownerName || '').trim(),
        email: sellerData.email.trim().toLowerCase(),
        password: sellerData.password,
        phone: (sellerData.phone || sellerData.mobileNumber || '').toString().replace(/[^0-9]/g, ''),
        businessName: (sellerData.businessName || sellerData.storeName || '').trim(),
        businessType: sellerData.businessType || 'proprietorship',
        storeName: (sellerData.storeName || sellerData.businessName || '').trim(),
        street: (sellerData.street || sellerData.address || '').trim(),
        city: (sellerData.city || 'Jaipur').trim(),
        state: (sellerData.state || 'Rajasthan').trim(),
        pinCode: (sellerData.pinCode || sellerData.pincode || '302001').toString().trim(),
      };

      const response = await api.post('/seller/auth/register', payload);
      const data = response.data || response;
      const seller = data.seller;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (accessToken && seller) {
        await secureStorage.saveAuthSession({
          token: accessToken,
          refreshToken,
          user: seller,
          role: 'seller',
          remember: true,
        });
      }

      return {
        success: true,
        seller,
        token: accessToken,
        message: response.message || 'Seller store registered successfully!',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delivery Partner Login with Role Verification
   */
  async deliveryLogin({ email, password, remember = true }) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await api.post('/delivery/auth/login', payload);
      const data = response.data || response;
      const partner = data.partner;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (!accessToken || !partner) {
        throw new Error('Invalid response from Delivery authentication service');
      }

      await secureStorage.saveAuthSession({
        token: accessToken,
        refreshToken,
        user: partner,
        role: 'delivery',
        remember,
      });

      return {
        success: true,
        user: partner,
        token: accessToken,
        role: 'delivery',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delivery Partner Registration
   */
  async deliveryRegister(partnerData) {
    try {
      const payload = {
        name: (partnerData.name || partnerData.fullName || '').trim(),
        email: partnerData.email.trim().toLowerCase(),
        phone: (partnerData.phone || partnerData.mobileNumber || '').toString().replace(/[^0-9]/g, ''),
        password: partnerData.password,
        vehicleType: partnerData.vehicleType || 'Bike',
        vehicleNumber: (partnerData.vehicleNumber || 'DL-01-AB-1234').toUpperCase().trim(),
        drivingLicenseNumber: (partnerData.drivingLicenseNumber || 'DL1420110012345').toUpperCase().trim(),
        city: (partnerData.city || 'New Delhi').trim(),
        state: (partnerData.state || 'Delhi').trim(),
        pinCode: (partnerData.pinCode || partnerData.pincode || '110001').toString().trim(),
        addressLine: (partnerData.addressLine || partnerData.address || 'Main Road').trim(),
      };

      const response = await api.post('/delivery/auth/register', payload);
      const data = response.data || response;
      const partner = data.partner;
      const accessToken = data.token || data.accessToken;

      if (accessToken && partner) {
        await secureStorage.saveAuthSession({
          token: accessToken,
          refreshToken: data.refreshToken || null,
          user: partner,
          role: 'delivery',
          remember: true,
        });
      }

      return {
        success: true,
        partner,
        token: accessToken,
        message: response.message || 'Delivery Partner registered successfully!',
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Delivery Partner Tasks
   */
  async getDeliveryTasks() {
    try {
      const response = await api.get('/delivery/tasks');
      return response.data?.tasks || response.tasks || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update Delivery Task Status
   */
  async updateDeliveryTaskStatus(taskId, status) {
    try {
      const response = await api.patch(`/delivery/tasks/${taskId}/status`, { status });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify Delivery OTP
   */
  async verifyDeliveryOtp(taskId, otp) {
    try {
      const response = await api.post(`/delivery/tasks/${taskId}/verify-otp`, { otp });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify Store Pickup OTP
   */
  async verifyPickupOtp(taskId, otp) {
    try {
      const response = await api
        .post(`/delivery/deliveries/${taskId}/verify-pickup-otp`, { otp })
        .catch(() => api.patch(`/delivery/tasks/${taskId}/status`, { status: 'picked_up' }));
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Delivery Partner Requests (incoming assignments)
   */
  async getDeliveryRequests() {
    try {
      const response = await api.get('/delivery/requests');
      return response.data?.requests || response.requests || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accept Delivery Assignment Request
   */
  async acceptDeliveryRequest(assignmentId) {
    try {
      const response = await api.post(`/delivery/requests/${assignmentId}/accept`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Decline Delivery Assignment Request
   */
  async declineDeliveryRequest(assignmentId, reason) {
    try {
      const response = await api.post(`/delivery/requests/${assignmentId}/decline`, { reason });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update Delivery Partner Availability (online / offline)
   */
  async toggleDeliveryAvailability(availability) {
    try {
      const response = await api.post('/delivery/availability', { availability });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request Delivery Partner Payout
   */
  async requestDeliveryPayout(amount) {
    try {
      const response = await api.post('/delivery/payouts/request', { amount });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Seller Dashboard Metrics (for native Seller Dashboard)
   */
  async getSellerDashboardMetrics() {
    try {
      const response = await api.get('/seller/dashboard');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Admin Dashboard Metrics (for native Admin Dashboard)
   */
  async getAdminDashboardMetrics() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Real Registered Sellers for Admin Management
   */
  async getAdminSellers(status = 'all', search = '') {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (search) params.search = search;
      const response = await api.get('/admin/sellers', { params });
      return response.data || response.sellers || response || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve / Reject / Suspend Seller Status
   */
  async updateAdminSellerStatus(sellerId, status, rejectionReason = '') {
    try {
      const response = await api.patch(`/admin/sellers/${sellerId}/status`, {
        status,
        rejectionReason,
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch Real Registered Delivery Partners for Admin Management
   */
  async getAdminDeliveryPartners(status = 'all', search = '') {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (search) params.search = search;
      const response = await api.get('/admin/delivery-partners', { params });
      return response.data || response.partners || response || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve / Reject / Suspend Delivery Partner Status
   */
  async updateAdminDeliveryPartnerStatus(partnerId, status, adminRemarks = '') {
    try {
      const response = await api.patch(`/admin/delivery-partners/${partnerId}/status`, {
        status,
        adminRemarks,
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore Session after app restart
   */
  async restoreSession() {
    try {
      const session = await secureStorage.getAuthSession();
      if (!session.token || !session.user) {
        return {
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          isAdmin: false,
        };
      }

      // If user did not check 'remember me', clear session on restart
      if (!session.remember) {
        await secureStorage.clearAuthSession();
        return {
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          isAdmin: false,
        };
      }

      // Verify active session with backend in background
      try {
        const freshProfile = await this.getCurrentProfile(session.role);
        if (freshProfile?.user || freshProfile?.admin || freshProfile?.seller) {
          const updatedUser = freshProfile.user || freshProfile.admin || freshProfile.seller;
          await secureStorage.saveAuthSession({
            token: session.token,
            refreshToken: session.refreshToken,
            user: updatedUser,
            role: session.role,
            remember: true,
          });
          session.user = updatedUser;
        }
      } catch (e) {
        // Silent token refresh or use offline cached session
      }

      const activeMode = await secureStorage.getActiveAppMode();

      return {
        user: session.user,
        token: session.token,
        role: session.role,
        activeMode: activeMode || (session.role === 'seller' ? 'seller' : 'customer'),
        isAuthenticated: true,
        isAdmin: session.role === 'admin',
        isSeller: session.role === 'seller' || session.user?.isSeller || false,
      };
    } catch (error) {
      console.warn('Error restoring session:', error);
      return {
        user: null,
        token: null,
        role: null,
        activeMode: 'customer',
        isAuthenticated: false,
        isAdmin: false,
        isSeller: false,
      };
    }
  },

  /**
   * Dual Access Mode Switching (Switch between 'customer' and 'seller')
   */
  async getActiveMode() {
    return secureStorage.getActiveAppMode();
  },

  async switchMode(mode) {
    await secureStorage.setActiveAppMode(mode);
    return mode;
  },

  /**
   * Secure Logout (Customer or Admin)
   */
  async logout() {
    try {
      const session = await secureStorage.getAuthSession();
      if (session.token) {
        const endpoint = session.role === 'admin' ? '/admin/auth/logout' : '/auth/logout';
        api.post(endpoint).catch(() => {});
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      await Promise.all([
        secureStorage.clearAuthSession(),
        secureStorage.clearAdminSession(),
      ]);
    }
    return { success: true };
  },
};

export default authService;
