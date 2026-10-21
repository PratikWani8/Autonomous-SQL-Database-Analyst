import api from './api';

export const analyticsService = {
  executeQuery: async (question, datasetId = null, tableName = null) => {
    const res = await api.post('/analytics/query', {
      question,
      datasetId,
      tableName
    });
    return res.data;
  },

  getQueryHistory: async (page = 1, limit = 20) => {
    const res = await api.get(`/analytics/history?page=${page}&limit=${limit}`);
    return res.data;
  },

  getQueryHistoryById: async (id) => {
    const res = await api.get(`/analytics/history/${id}`);
    return res.data;
  },

  rerunQuery: async (id) => {
    const res = await api.post(`/analytics/history/${id}/rerun`);
    return res.data;
  },

  deleteQueryHistory: async (id) => {
    const res = await api.delete(`/analytics/history/${id}`);
    return res.data;
  }
};
