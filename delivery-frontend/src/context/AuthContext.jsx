
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { Config } from '../constants/config';

export const AuthContext = createContext();

const getResponseData = (response) => {
  // api.js interceptor already returns response.data.
  // This also supports nested { data: {...} } responses.
  return response?.data || response || {};
};

const getPartner = (response) => {
  const data = getResponseData(response);
  return data.partner || data.deliveryPartner || null;
};

const getAccessToken = (response) => {
  const data = getResponseData(response);

  return (
    data.accessToken ||
    data.token ||
    data.access_token ||
    null
  );
};

export const AuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token && partner);
  const isApproved = partner?.kycStatus === 'approved';

  // Save session consistently
  const saveSession = async (user, accessToken, remember = true) => {
    if (!user || !accessToken) {
      throw new Error('Invalid login response: partner or token missing');
    }

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.TOKEN,
      accessToken
    );

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.USER,
      JSON.stringify(user)
    );

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.REMEMBER,
      remember ? 'true' : 'false'
    );

    setToken(accessToken);
    setPartner(user);

    socketService.connect(user._id);

    return user;
  };

  // Restore login session
  const loadSession = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem(
        Config.STORAGE_KEYS.TOKEN
      );

      const storedUser = await AsyncStorage.getItem(
        Config.STORAGE_KEYS.USER
      );

      if (!storedToken || !storedUser) {
        return;
      }

      const userObj = JSON.parse(storedUser);

      if (!userObj?._id) {
        throw new Error('Stored delivery partner data is invalid');
      }

      setToken(storedToken);
      setPartner(userObj);

      socketService.connect(userObj._id);

      // Refresh partner profile from backend
      try {
        const response = await deliveryService.getProfile();
        const freshPartner = getPartner(response);

        if (freshPartner) {
          setPartner(freshPartner);

          await AsyncStorage.setItem(
            Config.STORAGE_KEYS.USER,
            JSON.stringify(freshPartner)
          );
        }
      } catch (profileError) {
        console.warn(
          'Profile refresh failed:',
          profileError.message
        );
      }
    } catch (error) {
      console.warn('Session restore failed:', error.message);

      setToken(null);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Login
  const login = async (identifier, password, remember = true) => {
    if (!identifier?.trim() || !password) {
      throw new Error('Email/mobile number and password are required');
    }

    setIsLoading(true);

    try {
      const loginIdentifier = identifier.trim();

      const response = await deliveryService.login({
        // Existing backend deliveryLogin expects email.
        email: loginIdentifier,
        identifier: loginIdentifier,
        password,
      });

      const userObj = getPartner(response);
      const accessToken = getAccessToken(response);

      if (!userObj || !accessToken) {
        throw new Error(
          'Login response is incomplete. Backend must return partner and accessToken.'
        );
      }

      await saveSession(userObj, accessToken, remember);

      return response;
    } catch (error) {
      console.error('Delivery partner login failed:', error);

      throw new Error(
        error.message || 'Unable to login. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (formData) => {
    setIsLoading(true);

    try {
      const response = await deliveryService.register(formData);

      const userObj = getPartner(response);
      const accessToken = getAccessToken(response);

      // Some backends require OTP/KYC verification before login.
      if (userObj && accessToken) {
        await saveSession(userObj, accessToken, true);
      }

      return response;
    } catch (error) {
      console.error('Delivery partner registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        Config.STORAGE_KEYS.TOKEN,
        Config.STORAGE_KEYS.USER,
        Config.STORAGE_KEYS.REMEMBER,
        Config.STORAGE_KEYS.ONLINE_STATUS,
      ]);
    } catch (error) {
      console.warn('Logout storage cleanup failed:', error.message);
    } finally {
      socketService.disconnect();

      setToken(null);
      setPartner(null);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const response = await deliveryService.updateProfile(updates);
      const updatedPartner = getPartner(response);

      if (updatedPartner) {
        setPartner(updatedPartner);

        await AsyncStorage.setItem(
          Config.STORAGE_KEYS.USER,
          JSON.stringify(updatedPartner)
        );
      }

      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
