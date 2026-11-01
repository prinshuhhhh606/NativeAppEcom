import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/seller';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
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

// Response interceptor for error normalization and 401 handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // If unauthorized, clear token and redirect to login if not already there
      if (error.response.status === 401) {
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('Cannot connect to backend server. Make sure the server is online.'));
    }
    return Promise.reject(error);
  }
);

export default api;

