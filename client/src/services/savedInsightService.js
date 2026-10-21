import api from './api';

export const savedInsightService = {
  getSavedInsights: async () => {
    const res = await api.get('/saved-insights');
    return res.data;
  },

  createSavedInsight: async (insightData) => {
    const res = await api.post('/saved-insights', insightData);
    return res.data;
  },

  deleteSavedInsight: async (id) => {
    const res = await api.delete(`/saved-insights/${id}`);
    return res.data;
  }
};
