import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  initializing: true,
  error: null,

  // ─── Set tokens (used by api.js interceptor on refresh) ──────────────────
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken: refreshToken || get().refreshToken });
  },

  // ─── Login ───────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // authService.login returns { user, accessToken, refreshToken }
      const data = await authService.login(email, password);
      const { user, accessToken, refreshToken } = data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      const message = error.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // ─── Logout ──────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout even if API call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // ─── Check Auth (called on app mount) ────────────────────────────────────
  checkAuth: async () => {
    const { accessToken } = get();
    if (!accessToken) {
      set({ initializing: false });
      return false;
    }

    try {
      const user = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, initializing: false });
      return true;
    } catch {
      // Token invalid / expired — interceptor handles refresh
      // If refresh also fails, api.js will call logout and redirect
      get().clearAuth();
      return false;
    }
  },

  // ─── Change Password ────────────────────────────────────────────────────
  changePassword: async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword, newPassword);
      // Backend invalidates refresh token, so we logout
      get().clearAuth();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ─── Clear auth state locally (without API call) ─────────────────────────
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      initializing: false,
    });
  },

  // ─── Clear error ─────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
