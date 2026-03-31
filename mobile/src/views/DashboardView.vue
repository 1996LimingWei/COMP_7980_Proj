<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Summary Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="12">
            <ion-card class="summary-card">
              <ion-card-header>
                <ion-card-subtitle>Total Balance</ion-card-subtitle>
                <ion-card-title :color="transactionStore.netBalance >= 0 ? 'success' : 'danger'">
                  {{ formatCurrency(transactionStore.netBalance) }}
                </ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card class="summary-card">
              <ion-card-header>
                <ion-card-subtitle>Income</ion-card-subtitle>
                <ion-card-title color="success" class="amount-text">
                  {{ formatCurrency(transactionStore.totalIncome) }}
                </ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="summary-card">
              <ion-card-header>
                <ion-card-subtitle>Expenses</ion-card-subtitle>
                <ion-card-title color="danger" class="amount-text">
                  {{ formatCurrency(transactionStore.totalExpense) }}
                </ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Category Spending Chart -->
      <ion-card v-if="transactionStore.categoryStats.length > 0">
        <ion-card-header>
          <ion-card-title>Spending by Category</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <VueApexCharts
            type="pie"
            height="250"
            :options="categoryChartOptions"
            :series="categoryChartSeries"
          />
        </ion-card-content>
      </ion-card>

      <!-- Daily Spending Chart -->
      <ion-card v-if="transactionStore.dailyStats.length > 0">
        <ion-card-header>
          <ion-card-title>Daily Spending (Last 30 Days)</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <VueApexCharts
            type="area"
            height="200"
            :options="dailyChartOptions"
            :series="dailyChartSeries"
          />
        </ion-card-content>
      </ion-card>

      <!-- Recent Transactions -->
      <ion-list>
        <ion-list-header>
          <ion-label>Recent Transactions</ion-label>
          <ion-button fill="clear" size="small" router-link="/tabs/transactions">View All</ion-button>
        </ion-list-header>
        
        <ion-item-sliding v-for="t in transactionStore.recentTransactions" :key="t._id">
          <ion-item>
            <ion-label>
              <h3>{{ t.category }}</h3>
              <p>{{ t.description || 'No description' }}</p>
              <p>{{ formatDate(t.date) }}</p>
            </ion-label>
            <ion-note slot="end" :color="t.amount > 0 ? 'success' : 'danger'">
              {{ t.amount > 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
            </ion-note>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteTransaction(t._id)">
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>

        <ion-item v-if="transactionStore.recentTransactions.length === 0">
          <ion-label class="ion-text-center">No transactions yet</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';
import { trashOutline } from 'ionicons/icons';
import VueApexCharts from 'vue3-apexcharts';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonCardContent,
  IonList, IonListHeader, IonLabel, IonItemSliding,
  IonItem, IonItemOptions, IonItemOption, IonIcon,
  IonNote, IonRefresher, IonRefresherContent, IonButton
} from '@ionic/vue';

const transactionStore = useTransactionStore();

onMounted(() => {
  transactionStore.fetchDashboardData();
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

// Pie chart for spending by category
const categoryChartOptions = computed(() => ({
  chart: { type: 'pie' },
  labels: transactionStore.categoryStats.map(s => s.category),
  colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'],
  legend: { position: 'bottom', fontSize: '12px' },
  dataLabels: { enabled: false }
}));

const categoryChartSeries = computed(() =>
  transactionStore.categoryStats.map(s => Math.abs(s.expense))
);

// Area chart for daily spending
const dailyChartOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false } },
  xaxis: {
    categories: transactionStore.dailyStats.map(s => s.date),
    labels: { rotate: -45, style: { fontSize: '10px' } }
  },
  colors: ['#667eea'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2 } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' }
}));

const dailyChartSeries = computed(() => [{
  name: 'Expenses',
  data: transactionStore.dailyStats.map(s => Math.abs(s.expense))
}]);

const handleRefresh = async (event) => {
  await transactionStore.fetchDashboardData();
  event.target.complete();
};

const deleteTransaction = async (id) => {
  await transactionStore.deleteTransaction(id);
  await transactionStore.fetchDashboardData();
};
</script>

<style scoped>
.summary-card {
  margin: 0;
  text-align: center;
}

.summary-card ion-card-title {
  font-size: 20px;
}

.amount-text {
  font-size: 18px !important;
}
</style>
