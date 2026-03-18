import apiClient from './axios.js';

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me')
};

export const userAPI = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data)
};

export const transactionAPI = {
  getAll: (params) => apiClient.get('/transactions', { params }),
  getRecent: (limit = 5) => apiClient.get('/transactions/recent', { params: { limit } }),
  create: (data) => apiClient.post('/transactions', data),
  update: (id, data) => apiClient.put(`/transactions/${id}`, data),
  delete: (id) => apiClient.delete(`/transactions/${id}`)
};

export const statsAPI = {
  getSummary: () => apiClient.get('/stats/summary'),
  getByCategory: () => apiClient.get('/stats/category'),
  getDaily: (days) => apiClient.get('/stats/daily', { params: { days } })
};

export const aiAPI = {
  getAdvice: (question, includeContext = true) =>
    apiClient.post('/ai/advice', { question, includeContext })
};

export default { auth: authAPI, user: userAPI, transaction: transactionAPI, stats: statsAPI, ai: aiAPI };
