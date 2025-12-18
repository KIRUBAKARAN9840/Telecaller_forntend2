import axios from 'axios';

// Use relative URLs since Next.js handles API proxying
// In development, it will go to localhost:8000
// In production, it will go to the ngrok URL

// Create authenticated instance (for protected APIs)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // Important for web to send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create public instance (for OTP endpoints - no auth required)
export const publicApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔐 Request interceptor - Token from localStorage:', token ? 'exists' : 'none');
    console.log('🔐 Request interceptor - URL:', config.url);
    console.log('🔐 Request interceptor - withCredentials:', config.withCredentials);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Request interceptor - Added Authorization header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't already tried to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/telecaller/refresh-token', {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;