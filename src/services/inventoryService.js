import api from './api';

const INVENTORY_PREFIX = '/inventory';

export const inventoryService = {
  // Medicines
  getMedicines: async (params = {}) => {
    const response = await api.get(`${INVENTORY_PREFIX}/medicines`, { params });
    return response;
  },

  getMedicineById: async (id) => {
    const response = await api.get(`${INVENTORY_PREFIX}/medicines/${id}`);
    return response;
  },

  createMedicine: async (data) => {
    const response = await api.post(`${INVENTORY_PREFIX}/medicines`, data);
    return response;
  },

  updateMedicine: async (id, data) => {
    const response = await api.patch(`${INVENTORY_PREFIX}/medicines/${id}`, data);
    return response;
  },

  deleteMedicine: async (id) => {
    const response = await api.delete(`${INVENTORY_PREFIX}/medicines/${id}`);
    return response;
  },

  adjustStock: async (id, data) => {
    const response = await api.patch(`${INVENTORY_PREFIX}/medicines/${id}/stock`, data);
    return response;
  },

  getStockMovements: async (id, params = {}) => {
    const response = await api.get(`${INVENTORY_PREFIX}/medicines/${id}/movements`, { params });
    return response;
  },

  getLowStock: async () => {
    const response = await api.get(`${INVENTORY_PREFIX}/medicines/low-stock`);
    return response;
  },

  getExpiring: async (days) => {
    const params = days ? { days } : {};
    const response = await api.get(`${INVENTORY_PREFIX}/medicines/expiring`, { params });
    return response;
  },

  getExpired: async () => {
    const response = await api.get(`${INVENTORY_PREFIX}/medicines/expired`);
    return response;
  },

  // Categories
  getCategories: async (params = {}) => {
    const response = await api.get(`${INVENTORY_PREFIX}/categories`, { params });
    return response;
  },

  getActiveCategories: async () => {
    const response = await api.get(`${INVENTORY_PREFIX}/categories/active`);
    return response;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`${INVENTORY_PREFIX}/categories/${id}`);
    return response;
  },

  createCategory: async (data) => {
    const response = await api.post(`${INVENTORY_PREFIX}/categories`, data);
    return response;
  },

  updateCategory: async (id, data) => {
    const response = await api.patch(`${INVENTORY_PREFIX}/categories/${id}`, data);
    return response;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`${INVENTORY_PREFIX}/categories/${id}`);
    return response;
  },
};
