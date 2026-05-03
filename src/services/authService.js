import api from './api';

export const authService = {
  login: async (email, password) => {
    // POST /auth/login → { success, message, data: { user, accessToken, refreshToken } }
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    // POST /auth/register → { success, message, data: { user, accessToken, refreshToken } }
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    // GET /auth/me → { success, message, data: user }
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    // PATCH /auth/change-password
    // Backend requires { currentPassword, newPassword, confirmPassword }
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  logout: async () => {
    // POST /auth/logout (requires auth)
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    // POST /auth/refresh-token
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};
