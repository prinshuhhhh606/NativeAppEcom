import React, { createContext, useContext, useState, useEffect } from 'react';
import sellerService from '../services/sellerService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('seller_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch latest profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('seller_token');
      if (storedToken) {
        try {
          const res = await sellerService.getProfile();
          if (res?.data?.seller) {
            setSeller(res.data.seller);
            localStorage.setItem('seller_user', JSON.stringify(res.data.seller));
          }
        } catch (err) {
          console.error('Failed to restore seller session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await sellerService.login({ email, password });
      const sellerData = res.data?.seller || res.seller;
      if (sellerData && !sellerData._id) sellerData._id = sellerData.id;
      const authToken = res.data?.accessToken || res.accessToken || res.data?.token || res.token;
      const refreshToken = res.data?.refreshToken || res.refreshToken;

      localStorage.setItem('seller_token', authToken);
      if (refreshToken) {
        localStorage.setItem('seller_refresh_token', refreshToken);
      }
      localStorage.setItem('seller_user', JSON.stringify(sellerData));
      setToken(authToken);
      setSeller(sellerData);

      toast.success(`Welcome back, ${sellerData?.name || 'Partner'}!`);
      return { success: true, seller: sellerData };
    } catch (err) {
      const errorData = err.data || {};
      const status = errorData.status || (err.status === 403 ? 'pending' : null);
      const rejectionReason = errorData.rejectionReason || '';
      const message = err.message || errorData.message || 'Login failed. Please check credentials.';

      // Only show toast if not a structured approval status handled inline
      if (!['pending', 'rejected', 'suspended', 'blocked', 'under_review'].includes(status)) {
        toast.error(message);
      }
      return {
        success: false,
        error: message,
        message,
        status,
        rejectionReason,
        httpStatus: err.status,
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await sellerService.register(formData);
      const sellerData = res.data?.seller || res.seller;
      if (sellerData && !sellerData._id) sellerData._id = sellerData.id;

      // Pending admin approval workflow
      if (
        res.requiresApproval ||
        res.status === 'pending' ||
        res.data?.requiresApproval ||
        sellerData?.status === 'pending'
      ) {
        const msg =
          res.message ||
          'Your seller registration has been submitted successfully. Please wait for Admin approval.';
        toast.success(msg, { duration: 6000 });
        return {
          success: true,
          requiresApproval: true,
          status: 'pending',
          message: msg,
          seller: sellerData,
        };
      }

      const authToken = res.data?.accessToken || res.accessToken || res.data?.token || res.token;
      const refreshToken = res.data?.refreshToken || res.refreshToken;

      if (authToken) {
        localStorage.setItem('seller_token', authToken);
        if (refreshToken) {
          localStorage.setItem('seller_refresh_token', refreshToken);
        }
        localStorage.setItem('seller_user', JSON.stringify(sellerData));
        setToken(authToken);
        setSeller(sellerData);
      }

      toast.success('Seller registration successful! Welcome to Bharat Bazaar.');
      return { success: true, seller: sellerData };
    } catch (err) {
      const message = err.message || err.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    try {
      sellerService.logout().catch(() => {});
    } catch (_) {}
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_refresh_token');
    localStorage.removeItem('seller_user');
    setToken(null);
    setSeller(null);
    toast.success('Logged out successfully.');
  };

  const refreshProfile = async () => {
    try {
      const res = await sellerService.getProfile();
      if (res?.data?.seller) {
        const sellerData = res.data.seller;
        if (sellerData && !sellerData._id) sellerData._id = sellerData.id;
        setSeller(sellerData);
        localStorage.setItem('seller_user', JSON.stringify(sellerData));
        return sellerData;
      }
    } catch (err) {
      console.error('Profile refresh failed:', err);
    }
    return null;
  };

  const isApproved = seller?.status === 'approved';
  const isUnderReview = seller?.status === 'under_review';
  const isPendingVerification = seller?.status === 'pending_verification';
  const isPending =
    seller?.status === 'pending' ||
    seller?.status === 'pending_verification' ||
    seller?.status === 'under_review';
  const isRejected = seller?.status === 'rejected';
  const isSuspended = seller?.status === 'suspended' || seller?.status === 'blocked';

  return (
    <AuthContext.Provider
      value={{
        seller,
        token,
        loading,
        isAuthenticated: !!token && !!seller,
        isApproved,
        isPending,
        isRejected,
        isUnderReview,
        isPendingVerification,
        isSuspended,
        login,
        register,
        logout,
        refreshProfile,
        setSeller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
