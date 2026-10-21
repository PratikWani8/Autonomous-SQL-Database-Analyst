import api from './api';

export const datasetService = {
  getDatasets: async () => {
    const res = await api.get('/datasets');
    return res.data;
  },

  getDatasetById: async (id) => {
    const res = await api.get(`/datasets/${id}`);
    return res.data;
  },

  getDatasetSchema: async (id) => {
    const res = await api.get(`/datasets/${id}/schema`);
    return res.data;
  },

  getDatasetPreview: async (id) => {
    const res = await api.get(`/datasets/${id}/preview`);
    return res.data;
  }
};
