import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getSalesOverview: async (params = {}) => {
    const response = await api.get('/dashboard/sales-overview', { params });
    return response.data;
  },

  getRevenue: async (params = {}) => {
    const response = await api.get('/dashboard/revenue', { params });
    return response.data;
  },

  getStockStatus: async () => {
    const response = await api.get('/dashboard/stock-status');
    return response.data;
  },

  getTopSelling: async (params = {}) => {
    const response = await api.get('/dashboard/top-selling', { params });
    return response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },
};
