import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

// Normalize API base URL: handles both http://localhost:8080 and http://localhost:8080/api
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 session expiry and avoid redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/api/auth/login') ||
      error.config?.url?.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      // Clear invalid/expired token from local storage
      localStorage.removeItem('token');
      // Dispatch custom event to notify app of session expiration
      window.dispatchEvent(
        new CustomEvent('auth:expired', {
          detail: { message: 'Your session has expired. Please login again.' },
        })
      );
    }

    return Promise.reject(error);
  }
);

export const authService = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} data
   * @returns {Promise<{ message: string }>}
   */
  register: async ({ name, email, password }) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  },

  /**
   * Login with email and password
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string } }>}
   */
  login: async ({ email, password }) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  /**
   * Get current authenticated user profile
   * @returns {Promise<{ id: string, name: string, email: string, role: string }>}
   */
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const healthService = {
  getHealth: async () => {
    const response = await api.get(API_ENDPOINTS.HEALTH);
    return response.data;
  },
};

export default api;
