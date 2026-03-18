import { defineStore } from 'pinia';
import { transactionAPI, statsAPI } from '@/api/index.js';

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    recentTransactions: [],
    summary: null,
    categoryStats: [],
    loading: false
  }),

  getters: {
    totalIncome: (state) => state.summary?.thisMonth?.income || 0,
    totalExpense: (state) => state.summary?.thisMonth?.expense || 0,
    netBalance: (state) => state.summary?.overall?.totalBalance || 0
  },

  actions: {
    async fetchDashboardData() {
      this.loading = true;
      try {
        const [summaryRes, recentRes, categoryRes] = await Promise.all([
          statsAPI.getSummary(),
          transactionAPI.getRecent(10),
          statsAPI.getByCategory()
        ]);
        this.summary = summaryRes.data.summary;
        this.recentTransactions = recentRes.data.transactions;
        this.categoryStats = categoryRes.data.stats;
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },

    async createTransaction(data) {
      try {
        const response = await transactionAPI.create(data);
        await this.fetchDashboardData();
        return { success: true, transaction: response.data.transaction };
      } catch (error) {
        return { success: false, message: error.response?.data?.message };
      }
    },

    async deleteTransaction(id) {
      try {
        await transactionAPI.delete(id);
        await this.fetchDashboardData();
        return { success: true };
      } catch (error) {
        return { success: false, message: error.response?.data?.message };
      }
    }
  }
});
