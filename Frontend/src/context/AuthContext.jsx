/**
 * Role-Based Authentication Context
 * Manages Customer & Admin authentication state, secure session persistence,
 * role verification, and login/logout handlers.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // 'customer' | 'admin' | 'seller' | 'delivery'
  const [activeMode, setActiveMode] = useState('customer'); // 'customer' | 'seller'
  const [isLoading, setIsLoading] = useState(true);

  // Multi-role & Dual-access flags
  const isSeller =
    role === 'seller' ||
    user?.role === 'seller' ||
    user?.isSeller === true ||
    !!user?.storeName ||
    !!user?.storeSlug;
  const isDelivery = role === 'delivery';
  // Dual Access System: A seller has full customer capabilities
  const isCustomer = role === 'customer' || isSeller;
  const isAdmin =
    role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'manager';

  const isAuthenticated = !!token && !!user;

  /**
   * Dual Access Mode Switcher (Customer Shopping <-> Seller Business)
   * Seamless: No logout, no repeated login, same session token.
   * Preserves Cart & Wishlist.
   * Persists to @appecom_active_app_mode in AsyncStorage.
   */
  const switchMode = useCallback(async (newMode) => {
    const targetMode = newMode === 'seller' ? 'seller' : 'customer';
    setActiveMode(targetMode);
    await authService.switchMode(targetMode);
    return targetMode;
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode = activeMode === 'seller' ? 'customer' : 'seller';
    return switchMode(nextMode);
  }, [activeMode, switchMode]);

  /**
   * Boot-time session restoration
   */
  const loadStoredSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await authService.restoreSession();
      if (session.isAuthenticated) {
        setUser(session.user);
        setToken(session.token);
        setRole(session.role);
        setActiveMode(session.activeMode || 'customer');
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
        setActiveMode('customer');
      }
    } catch (e) {
      console.warn('Error during session boot check:', e);
      setUser(null);
      setToken(null);
      setRole(null);
      setActiveMode('customer');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredSession();
  }, [loadStoredSession]);

  /**
   * Customer Login (Email/Phone + Password)
   */
  const customerLogin = async (identifier, password, remember = true) => {
    setIsLoading(true);
    try {
      const res = await authService.customerLogin({ identifier, password, remember });
      setUser(res.user);
      setToken(res.token);
      setRole(res.role || (res.user?.isSeller ? 'seller' : 'customer'));
      setActiveMode('customer');
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Customer Registration
   */
  const customerRegister = async (userData) => {
    setIsLoading(true);
    try {
      const res = await authService.customerRegister(userData);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setRole('customer');
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request OTP
   */
  const requestOtp = async (phone) => {
    return authService.requestOtp(phone);
  };

  /**
   * Customer Verify OTP
   */
  const verifyOtp = async (phone, otp, remember = true) => {
    setIsLoading(true);
    try {
      const res = await authService.verifyOtp(phone, otp, remember);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setRole('customer');
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Customer Forgot Password
   */
  const forgotPassword = async (email) => {
    return authService.forgotPassword(email);
  };

  /**
   * Customer Reset Password
   */
  const resetPassword = async (email, otp, newPassword) => {
    return authService.resetPassword({ email, otp, newPassword });
  };

  /**
   * Admin Login with backend verification & role enforcement
   */
  const adminLogin = async (email, password, remember = true) => {
    setIsLoading(true);
    try {
      const res = await authService.adminLogin({ email, password, remember });
      setUser(res.user);
      setToken(res.token);
      setRole('admin');
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Seller Login with backend verification
   */
  const sellerLogin = async (email, password, remember = true) => {
    setIsLoading(true);
    try {
      const res = await authService.sellerLogin({ email, password, remember });
      setUser(res.user);
      setToken(res.token);
      setRole('seller');
      setActiveMode('seller');
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Seller Registration with backend integration
   */
  const sellerRegister = async (sellerData) => {
    setIsLoading(true);
    try {
      const res = await authService.sellerRegister(sellerData);
      if (res.seller && res.token) {
        setUser(res.seller);
        setToken(res.token);
        setRole('seller');
        setActiveMode('seller');
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delivery Partner Login with backend verification
   */
  const deliveryLogin = async (email, password, remember = true) => {
    setIsLoading(true);
    try {
      const res = await authService.deliveryLogin({ email, password, remember });
      setUser(res.user);
      setToken(res.token);
      setRole('delivery');
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delivery Partner Registration with backend integration
   */
  const deliveryRegister = async (partnerData) => {
    setIsLoading(true);
    try {
      const res = await authService.deliveryRegister(partnerData);
      if (res.partner && res.token) {
        setUser(res.partner);
        setToken(res.token);
        setRole('delivery');
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Secure Logout (Clears tokens, storage, resets role state)
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setRole(null);
      setIsLoading(false);
    }
  };

  /**
   * Update Profile data
   */
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const res = await authService.updateProfile(profileData, role);
      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh Profile data
   */
  const refreshProfile = async () => {
    try {
      const res = await authService.getCurrentProfile(role);
      const updatedUser = res?.user || res?.admin || res?.seller || res?.partner;
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  const authContextValue = useMemo(
    () => ({
      user,
      token,
      role,
      activeMode,
      isAuthenticated,
      isAdmin,
      isSeller,
      isDelivery,
      isCustomer,
      isLoading,
      switchMode,
      toggleMode,
      customerLogin,
      customerRegister,
      requestOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
      adminLogin,
      sellerLogin,
      sellerRegister,
      deliveryLogin,
      deliveryRegister,
      updateProfile,
      logout,
      refreshProfile,
      reloadSession: loadStoredSession,
      // Legacy alias to preserve backward compatibility with existing components
      register: customerRegister,
      login: customerLogin,
    }),
    [
      user,
      token,
      role,
      activeMode,
      isAuthenticated,
      isAdmin,
      isSeller,
      isDelivery,
      isCustomer,
      isLoading,
      switchMode,
      toggleMode,
      customerLogin,
      customerRegister,
      requestOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
      adminLogin,
      sellerLogin,
      sellerRegister,
      deliveryLogin,
      deliveryRegister,
      updateProfile,
      logout,
      loadStoredSession,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
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

export default AuthContext;
