import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { Config } from '../constants/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!partner;
  const isApproved = partner?.kycStatus === 'approved';

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(Config.STORAGE_KEYS.TOKEN);
      const storedUser = await AsyncStorage.getItem(Config.STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        const userObj = JSON.parse(storedUser);
        setToken(storedToken);
        setPartner(userObj);
        socketService.connect(userObj._id);

        // Fetch fresh profile in background
        deliveryService
          .getProfile()
          .then((res) => {
            if (res.data?.partner) {
              setPartner(res.data.partner);
              AsyncStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(res.data.partner));
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier, password, remember = true) => {
    setIsLoading(true);
    try {
      const res = await deliveryService.login({ identifier, password });
      const userObj = res.data?.partner || res.partner;
      const accessToken = res.data?.accessToken || res.data?.token || res.token;

      setToken(accessToken);
      setPartner(userObj);

      await AsyncStorage.setItem(Config.STORAGE_KEYS.TOKEN, accessToken);
      await AsyncStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(userObj));
      await AsyncStorage.setItem(Config.STORAGE_KEYS.REMEMBER, remember ? 'true' : 'false');

      socketService.connect(userObj._id);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await deliveryService.register(formData);
      const userObj = res.data?.partner || res.partner;
      const accessToken = res.data?.token || res.token;

      if (userObj && accessToken) {
        setToken(accessToken);
        setPartner(userObj);
        await AsyncStorage.setItem(Config.STORAGE_KEYS.TOKEN, accessToken);
        await AsyncStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(userObj));
        socketService.connect(userObj._id);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(Config.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(Config.STORAGE_KEYS.USER);
      socketService.disconnect();
    } finally {
      setToken(null);
      setPartner(null);
    }
  };

  const updateProfile = async (updates) => {
    const res = await deliveryService.updateProfile(updates);
    if (res.data?.partner) {
      setPartner(res.data.partner);
      await AsyncStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(res.data.partner));
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        partner,
        token,
        isAuthenticated,
        isApproved,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

