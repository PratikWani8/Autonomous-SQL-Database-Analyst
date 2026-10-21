import api from './api';

export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('sql_analyst_token', res.data.token);
      localStorage.setItem('sql_analyst_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('sql_analyst_token', res.data.token);
      localStorage.setItem('sql_analyst_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('sql_analyst_token');
      localStorage.removeItem('sql_analyst_user');
    }
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.user) {
      localStorage.setItem('sql_analyst_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }
};
