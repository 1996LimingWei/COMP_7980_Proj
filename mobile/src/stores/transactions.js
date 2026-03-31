import { defineStore } from 'pinia';
import { transactionAPI, statsAPI } from '@/api/index.js';

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    recentTransactions: [],
    summary: null,
    categoryStats: [],
    monthlyStats: [],
    dailyStats: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0
    }
  }),

  getters: {
    totalIncome: (state) => state.summary?.thisMonth?.income || 0,
    totalExpense: (state) => state.summary?.thisMonth?.expense || 0,
    netBalance: (state) => state.summary?.overall?.totalBalance || 0,
    expenseTransactions: (state) => state.transactions.filter(t => t.amount < 0),
    incomeTransactions: (state) => state.transactions.filter(t => t.amount > 0)
  },

  actions: {
    async fetchTransactions(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transactionAPI.getAll(params);
        this.transactions = response.data.transactions;
        this.pagination = response.data.pagination;
        return { success: true, data: response.data };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch transactions.';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    async fetchRecentTransactions(limit = 5) {
      try {
        const response = await transactionAPI.getRecent(limit);
        this.recentTransactions = response.data.transactions;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
        return { success: false };
      }
    },

    async createTransaction(transactionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transactionAPI.create(transactionData);
        await this.fetchRecentTransactions();
        return { success: true, transaction: response.data.transaction };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to create transaction.';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    async updateTransaction(id, transactionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transactionAPI.update(id, transactionData);
        const index = this.transactions.findIndex(t => t._id === id);
        if (index !== -1) {
          this.transactions[index] = response.data.transaction;
        }
        await this.fetchRecentTransactions();
        return { success: true, transaction: response.data.transaction };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update transaction.';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    async deleteTransaction(id) {
      this.loading = true;
      this.error = null;
      try {
        await transactionAPI.delete(id);
        this.transactions = this.transactions.filter(t => t._id !== id);
        await this.fetchRecentTransactions();
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete transaction.';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    async fetchSummary() {
      try {
        const response = await statsAPI.getSummary();
        this.summary = response.data.summary;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to fetch summary:', error);
        return { success: false };
      }
    },

    async fetchCategoryStats(params = {}) {
      try {
        const response = await statsAPI.getByCategory(params);
        this.categoryStats = response.data.stats;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to fetch category stats:', error);
        return { success: false };
      }
    },

    async fetchMonthlyStats(months = 6) {
      try {
        const response = await statsAPI.getMonthly(months);
        this.monthlyStats = response.data.stats;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to fetch monthly stats:', error);
        return { success: false };
      }
    },

    async fetchDailyStats(days = 30) {
      try {
        const response = await statsAPI.getDaily(days);
        this.dailyStats = response.data.stats;
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to fetch daily stats:', error);
        return { success: false };
      }
    },

    async fetchDashboardData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchSummary(),
          this.fetchRecentTransactions(10),
          this.fetchCategoryStats(),
          this.fetchDailyStats(30)
        ]);
        return { success: true };
      } catch (error) {
        this.error = 'Failed to load dashboard data.';
        return { success: false };
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});
