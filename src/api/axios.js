import axios from 'axios';
import authStore from '../store/authStore.js';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 for authenticated requests, not for login attempts
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      // Only logout and redirect for non-login requests
      authStore.getState().logout();
      window.location.href = '/login';
    }
    
    // For login requests, just reject the promise without redirecting
    return Promise.reject(error);
  }
);

export default api;