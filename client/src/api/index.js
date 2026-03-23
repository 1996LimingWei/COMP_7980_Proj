import apiClient from './axios.js';

/**
 * Authentication API
 */
export const authAPI = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    getMe: () => apiClient.get('/auth/me')
};

/**
 * User API
 */
export const userAPI = {
    getProfile: () => apiClient.get('/users/me'),
    updateProfile: (data) => apiClient.put('/users/me', data),
    getUserWithTransactions: (params) => apiClient.get('/users/me/transactions', { params })
};

/**
 * Transaction API
 */
export const transactionAPI = {
    getAll: (params) => apiClient.get('/transactions', { params }),
    getById: (id) => apiClient.get(`/transactions/${id}`),
    getRecent: (limit = 5) => apiClient.get('/transactions/recent', { params: { limit } }),
    create: (data) => apiClient.post('/transactions', data),
    update: (id, data) => apiClient.put(`/transactions/${id}`, data),
    delete: (id) => apiClient.delete(`/transactions/${id}`)
};

/**
 * Stats API
 */
export const statsAPI = {
    getSummary: () => apiClient.get('/stats/summary'),
    getByCategory: (params) => apiClient.get('/stats/category', { params }),
    getMonthly: (months) => apiClient.get('/stats/monthly', { params: { months } }),
    getDaily: (days) => apiClient.get('/stats/daily', { params: { days } })
};

/**
 * AI API
 */
export const aiAPI = {
    getAdvice: (question) =>
        apiClient.post('/ai/advice', { question, includeContext: true }),
    getGeneralAdvice: (question) =>
        apiClient.post('/ai/general', { question })
};

export default {
    auth: authAPI,
    user: userAPI,
    transaction: transactionAPI,
    stats: statsAPI,
    ai: aiAPI
};
