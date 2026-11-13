
/**
 * Role-Based Authentication Context
 * Manages Customer, Admin, Seller & Delivery authentication.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [activeMode, setActiveMode] = useState('customer');
  const [isLoading, setIsLoading] = useState(true);

  // Role-based access
  const isSeller =
    role === 'seller' ||
    user?.role === 'seller' ||
    user?.isSeller === true ||
    !!user?.storeName ||
    !!user?.storeSlug;

  const isDelivery = role === 'delivery';

  // Sellers also have customer shopping access
  const isCustomer = role === 'customer' || isSeller;

  const isAdmin =
    role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'manager';

  const isAuthenticated = !!token && !!user;

  /**
   * Switch between Customer and Seller modes
   */
  const switchMode = useCallback(async (newMode) => {
    const targetMode =
      newMode === 'seller' ? 'seller' : 'customer';

    await authService.switchMode(targetMode);
    setActiveMode(targetMode);

    return targetMode;
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode =
      activeMode === 'seller' ? 'customer' : 'seller';

    return switchMode(nextMode);
  }, [activeMode, switchMode]);

  /**
   * Restore stored authentication session
   */
  const loadStoredSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const session = await authService.restoreSession();

      if (session?.isAuthenticated && session?.user && session?.token) {
        setUser(session.user);
        setToken(session.token);
        setRole(session.role || 'customer');
        setActiveMode(session.activeMode || 'customer');
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
        setActiveMode('customer');
      }
    } catch (error) {
      console.warn(
        '[AuthContext] Session restoration failed:',
        error?.message
      );

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
   * Customer Login
   */
  const customerLogin = useCallback(
    async (identifier, password, remember = true) => {
      setIsLoading(true);

      try {
        const res = await authService.customerLogin({
          identifier,
          password,
          remember,
        });

        setUser(res.user);
        setToken(res.token);
        setRole(
          res.role || (res.user?.isSeller ? 'seller' : 'customer')
        );
        setActiveMode('customer');

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Customer Registration
   */
  const customerRegister = useCallback(async (userData) => {
    setIsLoading(true);

    try {
      const res = await authService.customerRegister(userData);

      if (res?.user && res?.token) {
        setUser(res.user);
        setToken(res.token);
        setRole('customer');
        setActiveMode('customer');
      }

      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request OTP
   */
  const requestOtp = useCallback(async (phone) => {
    return authService.requestOtp(phone);
  }, []);

  /**
   * Verify OTP
   */
  const verifyOtp = useCallback(
    async (phone, otp, remember = true) => {
      setIsLoading(true);

      try {
        const res = await authService.verifyOtp(
          phone,
          otp,
          remember
        );

        if (res?.user && res?.token) {
          setUser(res.user);
          setToken(res.token);
          setRole('customer');
          setActiveMode('customer');
        }

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Forgot Password
   */
  const forgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email);
  }, []);

  /**
   * Reset Password
   */
  const resetPassword = useCallback(
    async (email, otp, newPassword) => {
      return authService.resetPassword({
        email,
        otp,
        newPassword,
      });
    },
    []
  );

  /**
   * Admin Login
   */
  const adminLogin = useCallback(
    async (email, password, remember = true) => {
      setIsLoading(true);

      try {
        const res = await authService.adminLogin({
          email,
          password,
          remember,
        });

        setUser(res.user);
        setToken(res.token);
        setRole('admin');
        setActiveMode('customer');

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Seller Login
   */
  const sellerLogin = useCallback(
    async (email, password, remember = true) => {
      setIsLoading(true);

      try {
        const res = await authService.sellerLogin({
          email,
          password,
          remember,
        });

        setUser(res.user);
        setToken(res.token);
        setRole('seller');
        setActiveMode('seller');

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Seller Registration
   */
  const sellerRegister = useCallback(async (sellerData) => {
    setIsLoading(true);

    try {
      const res = await authService.sellerRegister(sellerData);

      const sellerUser = res?.seller || res?.user;

      if (sellerUser && res?.token) {
        setUser(sellerUser);
        setToken(res.token);
        setRole('seller');
        setActiveMode('seller');
      }

      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delivery Partner Login
   */
  const deliveryLogin = useCallback(
    async (email, password, remember = true) => {
      setIsLoading(true);

      try {
        const res = await authService.deliveryLogin({
          email,
          password,
          remember,
        });

        setUser(res.user);
        setToken(res.token);
        setRole('delivery');
        setActiveMode('customer');

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delivery Partner Registration
   */
  const deliveryRegister = useCallback(async (partnerData) => {
    setIsLoading(true);

    try {
      const res = await authService.deliveryRegister(partnerData);

      const partnerUser = res?.partner || res?.user;

      if (partnerUser && res?.token) {
        setUser(partnerUser);
        setToken(res.token);
        setRole('delivery');
        setActiveMode('customer');
      }

      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setRole(null);
      setActiveMode('customer');
      setIsLoading(false);
    }
  }, []);

  /**
   * Update Profile
   */
  const updateProfile = useCallback(
    async (profileData) => {
      setIsLoading(true);

      try {
        const res = await authService.updateProfile(
          profileData,
          role
        );

        if (res?.user) {
          setUser((prev) => ({
            ...prev,
            ...res.user,
          }));
        }

        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [role]
  );

  /**
   * Refresh Profile
   */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await authService.getCurrentProfile(role);

      const updatedUser =
        res?.user ||
        res?.admin ||
        res?.seller ||
        res?.partner;

      if (updatedUser) {
        setUser(updatedUser);
      }

      return updatedUser || null;
    } catch (error) {
      console.warn(
        '[AuthContext] Profile refresh failed:',
        error?.message
      );

      return null;
    }
  }, [role]);

  /**
   * Context Value
   */
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

      // Backward compatibility
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
      refreshProfile,
      loadStoredSession,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Authentication Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};

export default AuthContext;
