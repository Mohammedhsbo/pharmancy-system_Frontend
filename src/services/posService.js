import api from './api';

export const posService = {
  createInvoice: async (invoiceData) => {
    const response = await api.post('/pos/invoices', invoiceData);
    return response.data;
  },

  getInvoices: async (params = {}) => {
    const response = await api.get('/pos/invoices', { params });
    return response;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/pos/invoices/${id}`);
    return response.data;
  },

  processRefund: async (id, data) => {
    const response = await api.post(`/pos/invoices/${id}/refund`, data);
    return response.data;
  },

  getDailySales: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/pos/sales/daily', { params });
    return response.data;
  },
};
