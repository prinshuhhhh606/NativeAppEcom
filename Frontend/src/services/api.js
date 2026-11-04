/**
 * Axios API Client for Pan India E-Commerce
 * Configured with base URL, token authorization, automatic token refresh,
 * standardized response unpacking, and robust error handling.
 */
import axios from 'axios';
import { Config } from '../constants/config';
import secureStorage from '../utils/secureStorage';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      const url = config.url || '';
      const isAdminRoute = url.includes('/admin') || url.startsWith('admin');
      const isSellerRoute = url.includes('/seller') || url.startsWith('seller') || url.includes('/v1/seller');
      const isDeliveryRoute = url.includes('/delivery') || url.startsWith('delivery');

      let token = null;

      if (isAdminRoute) {
        // Prioritize dedicated admin token for all admin endpoints
        token = await secureStorage.getAdminToken();
        if (!token) {
          const session = await secureStorage.getAuthSession();
          if (session.isAdmin) token = session.token;
        }
      } else if (isSellerRoute) {
        token = await secureStorage.getSellerToken();
        if (!token) {
          const session = await secureStorage.getAuthSession();
          if (session.isSeller) token = session.token;
        }
      } else if (isDeliveryRoute) {
        token = await secureStorage.getDeliveryToken();
      }

      // Default fallback if route-specific token not determined
      if (!token) {
        token = await secureStorage.getAccessToken();
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve auth token for request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Singleton refresh queue to serialize concurrent 401 token refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Standardized Responses, Token Refresh & Error Normalization
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status || 500;

    // Automatic Network Host Failover (Only on actual network disconnection)
    const isNetworkDisconnection =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Cannot connect'));

    if (isNetworkDisconnection && originalRequest && !originalRequest._networkFallbackDone) {
      originalRequest._networkFallbackDone = true;
      const candidates = Config.API_CANDIDATE_URLS || [];
      for (const candidate of candidates) {
        if (candidate !== api.defaults.baseURL) {
          try {
            const method = (originalRequest.method || 'get').toLowerCase();
            const headers = { ...(originalRequest.headers || {}) };
            delete headers.host;
            delete headers.Host;

            const retryRes = await axios({
              method,
              baseURL: candidate,
              url: originalRequest.url,
              data: originalRequest.data,
              params: originalRequest.params,
              headers,
              timeout: 3500,
            });

            // Lock onto functioning base URL
            api.defaults.baseURL = candidate;
            if (typeof Config.updateApiBaseUrl === 'function') {
              Config.updateApiBaseUrl(candidate);
            } else {
              Config.API_BASE_URL = candidate;
              Config.SOCKET_URL = candidate.replace(/\/api\/?$/, '');
            }
            return retryRes.data;
          } catch (retryErr) {
            // Continue testing remaining candidates
          }
        }
      }
    }

    // Handle 401 Token Expiry & Automatic Refresh (prevent infinite loop & serial queue)
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      // If a refresh is already in progress, queue this request until refresh finishes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken.trim()}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const reqUrl = originalRequest.url || '';
      const isAdminRoute = reqUrl.includes('/admin') || reqUrl.startsWith('admin');
      const isSellerRoute = reqUrl.includes('/seller') || reqUrl.startsWith('seller') || reqUrl.includes('/v1/seller');

      try {
        let refreshToken = null;
        let refreshUrl = '';

        if (isAdminRoute) {
          refreshToken =
            (await secureStorage.getAdminRefreshToken()) ||
            (await secureStorage.getRefreshToken());
          refreshUrl = `${Config.API_BASE_URL}/admin/auth/refresh-token`;
        } else if (isSellerRoute) {
          refreshToken =
            (await secureStorage.getSellerRefreshToken()) ||
            (await secureStorage.getRefreshToken());
          refreshUrl = `${Config.API_BASE_URL}/v1/seller/auth/refresh-token`;
        } else {
          const session = await secureStorage.getAuthSession();
          refreshToken =
            session.role === 'seller'
              ? (await secureStorage.getSellerRefreshToken()) || (await secureStorage.getRefreshToken())
              : await secureStorage.getRefreshToken();
          refreshUrl =
            session.role === 'admin'
              ? `${Config.API_BASE_URL}/admin/auth/refresh-token`
              : session.role === 'seller'
              ? `${Config.API_BASE_URL}/v1/seller/auth/refresh-token`
              : `${Config.API_BASE_URL}/auth/refresh-token`;
        }

        if (refreshToken) {
          // Call raw axios to prevent recursion
          const refreshResponse = await axios.post(
            refreshUrl,
            { refreshToken },
            { timeout: 10000 }
          );

          const newAccessToken =
            refreshResponse.data?.data?.accessToken ||
            refreshResponse.data?.data?.token ||
            refreshResponse.data?.accessToken;

          const newRefreshToken =
            refreshResponse.data?.data?.refreshToken ||
            refreshResponse.data?.refreshToken;

          if (newAccessToken) {
            if (isAdminRoute) {
              await secureStorage.updateAdminAccessToken(newAccessToken);
            } else {
              await secureStorage.updateAccessToken(newAccessToken);
            }

            if (newRefreshToken) {
              await secureStorage.updateRefreshToken(newRefreshToken);
            }

            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken.trim()}`;
            return api(originalRequest);
          }
        }

        processQueue(new Error('Refresh response did not return token'), null);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Only clear stored session on true unauthenticated 401, not network glitches
        if (refreshErr.response?.status === 401) {
          if (isAdminRoute) {
            await secureStorage.clearAdminSession();
          } else {
            await secureStorage.clearAuthSession();
          }
        }
      } finally {
        isRefreshing = false;
      }
    }

    // Standardize error message based on status code and response payload
    let userFriendlyMessage = 'Something went wrong. Please try again.';

    if (error.response?.data?.message) {
      userFriendlyMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      userFriendlyMessage = error.response.data.error;
    } else if (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]) {
      userFriendlyMessage = error.response.data.errors[0];
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      userFriendlyMessage = 'Request timed out. Please check your internet connection.';
    } else if (!error.response) {
      userFriendlyMessage = 'Cannot connect to backend server. Make sure the server is online at port 5000 and port forwarding (adb reverse tcp:5000 tcp:5000) is active.';
    } else {
      switch (status) {
        case 400:
          userFriendlyMessage = 'Invalid request. Please check the entered data.';
          break;
        case 401:
          userFriendlyMessage = 'Session expired or invalid credentials. Please log in.';
          break;
        case 403:
          userFriendlyMessage = 'Access denied: You do not have permission to view this resource.';
          break;
        case 404:
          userFriendlyMessage = 'Requested resource not found.';
          break;
        case 422:
          userFriendlyMessage = 'Validation failed. Please verify all required fields.';
          break;
        case 429:
          userFriendlyMessage = 'Too many requests. Please slow down and try again shortly.';
          break;
        case 500:
        default:
          userFriendlyMessage = 'Internal server error. Please try again later.';
          break;
      }
    }

    const errorResponse = {
      status,
      message: userFriendlyMessage,
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };

    return Promise.reject(errorResponse);
  }
);

/**
 * Proactively probe candidate backend URLs and lock onto the live endpoint
 */
export const probeBackendConnection = async () => {
  const candidates = Config.API_CANDIDATE_URLS || [];
  for (const candidate of candidates) {
    try {
      const res = await axios.get(`${candidate}/health`, { timeout: 2500 });
      if (res.status === 200 && res.data) {
        api.defaults.baseURL = candidate;
        if (typeof Config.updateApiBaseUrl === 'function') {
          Config.updateApiBaseUrl(candidate);
        } else {
          Config.API_BASE_URL = candidate;
          Config.SOCKET_URL = candidate.replace(/\/api\/?$/, '');
        }
        return candidate;
      }
    } catch (e) {
      // Continue next candidate
    }
  }
  return null;
};

export default api;
