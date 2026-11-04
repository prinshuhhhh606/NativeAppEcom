import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/seller';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach latest JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('seller_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mutex / Queue to handle concurrent 401s without multiple refresh requests
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

// Response interceptor with robust auto-refresh and request retry
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle Rate Limiting (HTTP 429)
    if (error.response?.status === 429) {
      const rateLimitMsg =
        error.response.data?.message ||
        error.response.data?.error ||
        'Too many requests. Please wait a moment before trying again.';
      return Promise.reject(new Error(rateLimitMsg));
    }

    // Check if error is 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh-token');

      // Do not attempt refresh on auth endpoints themselves
      if (isAuthEndpoint) {
        const msg = error.response.data?.message || error.response.data?.error || 'Invalid credentials';
        return Promise.reject(new Error(msg));
      }

      // If this request was already retried once, bail out to prevent infinite loop
      if (originalRequest._retry) {
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_refresh_token');
        localStorage.removeItem('seller_user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      // If refresh is already in progress, enqueue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('seller_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Authentication required. Please log in.'));
      }

      try {
        // Use raw axios to prevent interceptor recursion
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        const newAccessToken =
          refreshRes.data?.data?.accessToken ||
          refreshRes.data?.accessToken;
        const newRefreshToken =
          refreshRes.data?.data?.refreshToken ||
          refreshRes.data?.refreshToken;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh');
        }

        localStorage.setItem('seller_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('seller_refresh_token', newRefreshToken);
        }

        // Update default and current request auth header
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_refresh_token');
        localStorage.removeItem('seller_user');

        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }

        return Promise.reject(new Error('Your session has expired. Please log in again.'));
      }
    }

    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      const customErr = new Error(message);
      customErr.status = error.response.status;
      customErr.data = error.response.data;
      return Promise.reject(customErr);
    } else if (error.request) {
      return Promise.reject(new Error('Cannot connect to backend server. Make sure the server is online.'));
    }

    return Promise.reject(error);
  }
);

export default api;
