import axios from 'axios';

// Use relative URLs since Next.js handles API proxying
// In development, it will go to localhost:8000
// In production, it will go to the ngrok URL

// Create authenticated instance (for protected APIs)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // Important for web to send/receive cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create public instance (for OTP endpoints - no auth required)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // Also support cookies for public endpoints
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track ongoing refresh requests to avoid multiple simultaneous refresh attempts
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

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't attempt refresh for auth endpoints
    if (originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/send-otp') || originalRequest.url?.includes('/verify-otp')) {
      return Promise.reject(error);
    }

    // Mark request as retried to prevent infinite loops
    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Start refresh process
    isRefreshing = true;

    try {
      // Get user info from localStorage for refresh request
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        // No user info, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      const user = JSON.parse(userStr);
      const userId = user.id;
      const userRole = user.role;

      if (!userId || !userRole) {
        throw new Error('Missing user information for token refresh');
      }

      // Call refresh endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/refresh`,
        {
          id: userId,
          role: userRole,
          device: 'web',
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Refresh successful, process queue
      processQueue(null, response.data);

      // Retry original request with new credentials
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear queue and redirect to login
      processQueue(refreshError, null);

      // Clear user data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// For web clients, authentication is handled via HTTP-only cookies
// No need to add Authorization headers from localStorage
// Cookies are sent automatically with withCredentials: true
// The interceptor above handles automatic token refresh when access token expires

export default api;
