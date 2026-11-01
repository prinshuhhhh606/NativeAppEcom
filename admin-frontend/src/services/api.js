import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('appecom_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh & unified error extraction
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('appecom_admin_refresh_token');

      if (refreshToken) {
        try {
          const refreshBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';
          const res = await axios.post(`${refreshBaseUrl}/auth/refresh-token`, {
            refreshToken,
          });
          const newAccessToken = res.data?.data?.accessToken;
          const newRefreshToken = res.data?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem('appecom_admin_token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('appecom_admin_refresh_token', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('appecom_admin_token');
          localStorage.removeItem('appecom_admin_refresh_token');
          localStorage.removeItem('appecom_admin_user');
          window.location.href = '/login';
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (Array.isArray(error.response?.data?.errors) ? error.response.data.errors[0] : null) ||
      (!error.response ? 'Cannot connect to backend server. Make sure the server is online at http://localhost:5000.' : null) ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject({
      message,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    });
  }
);

export default api;

