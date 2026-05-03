import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

const API_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Request interceptor: attach JWT access token ────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: unwrap backend envelope + handle 401 refresh ──────

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

// ─── Global toast helper (works outside React components) ────────────────────

const showToast = (type, message) => {
  useUIStore.getState().addToast({ type, message });
};

// ─── Map HTTP status to user-friendly toast message ──────────────────────────

const getErrorToastMessage = (status, backendMessage) => {
  switch (status) {
    case 400:
      return backendMessage || 'Invalid request. Please check your input.';
    case 401:
      return 'Please login again.';
    case 403:
      return backendMessage || "You don't have permission to perform this action.";
    case 404:
      return backendMessage || 'Resource not found.';
    case 409:
      return backendMessage || 'A conflict occurred. The resource may already exist.';
    case 429:
      return 'Too many requests. Please try again later.';
    default:
      if (status >= 500) {
        return 'Server error. Please try again later.';
      }
      return backendMessage || 'An unexpected error occurred.';
  }
};

api.interceptors.response.use(
  (response) => {
    // Backend wraps all responses in { success, message, data, meta }
    const resData = response.data || {};
    
    // Normalization to prevent undefined payloads crashing frontend
    return {
      success: resData.success ?? true,
      message: resData.message || '',
      data: resData.data ?? (Array.isArray(resData) ? resData : null),
      meta: resData.meta || null
    };
  },
  async (error) => {
    const originalRequest = error.config;

    // ─── Handle network / timeout errors ───────────────────────────────
    if (!error.response) {
      const networkMessage = error.code === 'ECONNABORTED'
        ? 'Request timed out. Please check your connection.'
        : 'Network error. Please check your connection.';
      showToast('error', networkMessage);

      const networkError = new Error(networkMessage);
      networkError.status = 0;
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    const status = error.response.status;
    const backendMessage = error.response?.data?.message;

    // ─── If 401 and we haven't already tried to refresh for this request ──
    if (status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this IS the refresh request or login request
      if (
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        // Show toast for login/refresh failures
        showToast('error', backendMessage || 'Authentication failed.');
        return Promise.reject(createEnhancedError(error));
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly with axios to avoid interceptor loops
        const { data: refreshResponse } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        // Update store and localStorage
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed → full logout
        showToast('error', 'Session expired. Please login again.');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ─── For all other errors: show toast + reject ──────────────────────
    const toastMessage = getErrorToastMessage(status, backendMessage);
    showToast('error', toastMessage);

    return Promise.reject(createEnhancedError(error));
  }
);

// ─── Create enhanced error object ────────────────────────────────────────────

function createEnhancedError(axiosError) {
  const message =
    axiosError.response?.data?.message || axiosError.message || 'An error occurred';
  const enhancedError = new Error(message);
  enhancedError.status = axiosError.response?.status;
  enhancedError.errors = axiosError.response?.data?.errors;
  enhancedError.originalError = axiosError;
  return enhancedError;
}

export default api;
