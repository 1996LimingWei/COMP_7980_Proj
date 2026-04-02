<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';
import VueApexCharts from 'vue3-apexcharts';
import AddTransactionModal from '@/components/AddTransactionModal.vue';

const transactionStore = useTransactionStore();
const showAddModal = ref(false);
const editingTransaction = ref(null);

// Time range selector for category chart
const categoryTimeRange = ref(30);
const dailyTimeRange = ref(30);
const timeRangeOptions = [
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 180, label: 'Last 180 Days' },
  { value: 360, label: 'Last 360 Days' }
];

onMounted(() => {
  transactionStore.fetchDashboardData();
  fetchCategoryStats();
  fetchDailyStats();
});

// Watch for time range changes
watch(categoryTimeRange, () => {
  fetchCategoryStats();
});

watch(dailyTimeRange, () => {
  fetchDailyStats();
});

const fetchCategoryStats = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - categoryTimeRange.value);
  
  await transactionStore.fetchCategoryStats({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
};

const fetchDailyStats = async () => {
  await transactionStore.fetchDailyStats(dailyTimeRange.value);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Pie chart for spending by category
const categoryChartOptions = computed(() => ({
  chart: { type: 'pie' },
  labels: transactionStore.categoryStats.map(s => s.category),
  colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: false }
}));

const categoryChartSeries = computed(() => 
  transactionStore.categoryStats.map(s => Math.abs(s.expense))
);

// Line chart for daily spending
const dailyChartOptions = computed(() => {
  // Determine tick interval based on time range
  let tickAmount = undefined;
  if (dailyTimeRange.value === 90) {
    tickAmount = 6; // Show ~6 ticks for 90 days (every ~15 days)
  } else if (dailyTimeRange.value === 180) {
    tickAmount = 6; // Show ~6 ticks for 180 days (every ~30 days)
  } else if (dailyTimeRange.value === 360) {
    tickAmount = 6; // Show ~6 ticks for 360 days (every ~60 days)
  }

  return {
    chart: { type: 'area', toolbar: { show: false } },
    xaxis: { 
      categories: transactionStore.dailyStats.map(s => s.date),
      labels: { rotate: -45 },
      tickAmount: tickAmount
    },
    colors: ['#667eea'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2 } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' }
  };
});

const dailyChartSeries = computed(() => [{
  name: 'Expenses',
  data: transactionStore.dailyStats.map(s => Math.abs(s.expense))
}]);

const openAddModal = () => {
  editingTransaction.value = null;
  showAddModal.value = true;
};

const editTransaction = (transaction) => {
  editingTransaction.value = transaction;
  showAddModal.value = true;
};

const deleteTransaction = async (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    await transactionStore.deleteTransaction(id);
    await transactionStore.fetchDashboardData();
  }
};

const handleTransactionSaved = async () => {
  showAddModal.value = false;
  editingTransaction.value = null;
  await transactionStore.fetchDashboardData();
};
</script>

<template>
  <div class="dashboard-page py-4">
    <div class="container">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold">Dashboard</h2>
        <button class="btn btn-primary" @click="openAddModal">
          <i class="bi bi-plus-lg me-2"></i>Add Transaction
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="card summary-card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="icon-circle bg-primary bg-opacity-10 text-primary">
                  <i class="bi bi-wallet2"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0">Total Balance</p>
                  <h4 class="fw-bold mb-0">{{ formatCurrency(transactionStore.summary?.overall?.totalBalance) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card summary-card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="icon-circle bg-success bg-opacity-10 text-success">
                  <i class="bi bi-arrow-down-circle"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0">Income ({{ transactionStore.summary?.thisMonth?.label || 'This Month' }})</p>
                  <h4 class="fw-bold mb-0 text-success">{{ formatCurrency(transactionStore.summary?.thisMonth?.income) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card summary-card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="icon-circle bg-danger bg-opacity-10 text-danger">
                  <i class="bi bi-arrow-up-circle"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0">Expenses ({{ transactionStore.summary?.thisMonth?.label || 'This Month' }})</p>
                  <h4 class="fw-bold mb-0 text-danger">{{ formatCurrency(transactionStore.summary?.thisMonth?.expense) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">Spending by Category</h5>
              <select v-model="categoryTimeRange" class="form-select form-select-sm" style="width: auto;">
                <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="card-body">
              <VueApexCharts
                type="pie"
                height="300"
                :options="categoryChartOptions"
                :series="categoryChartSeries"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">Spending Details</h5>
              <select v-model="dailyTimeRange" class="form-select form-select-sm" style="width: auto;">
                <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="card-body">
              <VueApexCharts
                type="area"
                height="300"
                :options="dailyChartOptions"
                :series="dailyChartSeries"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold mb-0">Recent Transactions</h5>
          <router-link to="/transactions" class="btn btn-sm btn-outline-primary">View All</router-link>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th class="text-end">Amount</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactionStore.recentTransactions" :key="transaction._id">
                  <td>{{ formatDate(transaction.date) }}</td>
                  <td>
                    <span class="badge bg-secondary">{{ transaction.category }}</span>
                  </td>
                  <td>{{ transaction.description || '-' }}</td>
                  <td class="text-end" :class="transaction.amount > 0 ? 'text-success' : 'text-danger'">
                    {{ transaction.amount > 0 ? '+' : '' }}{{ formatCurrency(transaction.amount) }}
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" @click="editTransaction(transaction)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteTransaction(transaction._id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="transactionStore.recentTransactions.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">No transactions yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Transaction Modal -->
    <AddTransactionModal
      v-if="showAddModal"
      :transaction="editingTransaction"
      @close="showAddModal = false"
      @saved="handleTransactionSaved"
    />
  </div>
</template>

<style scoped>
.dashboard-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.summary-card {
  border-radius: 15px;
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card {
  border-radius: 15px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.table th {
  font-weight: 600;
  color: #6c757d;
}
</style>
