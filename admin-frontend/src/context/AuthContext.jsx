import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminSession();
  }, []);

  const loadAdminSession = async () => {
    try {
      const storedToken = localStorage.getItem('appecom_admin_token');
      const storedUser = localStorage.getItem('appecom_admin_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedUser));
        // Verify with server in background
        api
          .get('/auth/me')
          .then((res) => {
            if (res.data?.admin) {
              setAdmin(res.data.admin);
              localStorage.setItem('appecom_admin_user', JSON.stringify(res.data.admin));
            }
          })
          .catch((err) => {
            // If token is invalid or expired and cannot be refreshed, clear session
            if (err?.status === 401 || err?.status === 403) {
              setToken(null);
              setAdmin(null);
              localStorage.removeItem('appecom_admin_token');
              localStorage.removeItem('appecom_admin_refresh_token');
              localStorage.removeItem('appecom_admin_user');
            }
          });
      }
    } catch (e) {
      console.warn('Failed restoring admin session', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { admin: adminUser, accessToken, refreshToken } = res.data;

      setAdmin(adminUser);
      setToken(accessToken);

      localStorage.setItem('appecom_admin_token', accessToken);
      localStorage.setItem('appecom_admin_refresh_token', refreshToken);
      localStorage.setItem('appecom_admin_user', JSON.stringify(adminUser));

      toast.success(`Welcome back, ${adminUser.name}!`);
      return adminUser;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('appecom_admin_token');
      localStorage.removeItem('appecom_admin_refresh_token');
      localStorage.removeItem('appecom_admin_user');
      toast.success('Logged out successfully');
    }
  };

  const hasRole = (...roles) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return roles.includes(admin.role);
  };

  const hasPermission = (...requiredPerms) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    const perms = admin.permissions || [];
    return requiredPerms.some(
      (p) => perms.includes(p) || perms.includes('*') || perms.includes(`${p.split(':')[0]}:*`)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

