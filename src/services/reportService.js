import api from './api';

export const reportService = {
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getProfitReport: async (params = {}) => {
    const response = await api.get('/reports/profit', { params });
    return response.data;
  },

  getInventoryReport: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  getPatientReport: async (params = {}) => {
    const response = await api.get('/reports/patients', { params });
    return response.data;
  },
};
