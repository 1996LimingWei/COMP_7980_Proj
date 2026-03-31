<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Summary Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card class="summary-card">
              <ion-card-header>
                <ion-card-subtitle>Balance</ion-card-subtitle>
                <ion-card-title>{{ formatCurrency(transactionStore.netBalance) }}</ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="summary-card">
              <ion-card-header>
                <ion-card-subtitle>This Month</ion-card-subtitle>
                <ion-card-title :color="transactionStore.totalIncome - transactionStore.totalExpense >= 0 ? 'success' : 'danger'">
                  {{ formatCurrency(transactionStore.totalIncome - transactionStore.totalExpense) }}
                </ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Recent Transactions -->
      <ion-list>
        <ion-list-header>
          <ion-label>Recent Transactions</ion-label>
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

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';
import { trashOutline } from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonList, IonListHeader,
  IonLabel, IonItemSliding, IonItem, IonItemOptions,
  IonItemOption, IonIcon, IonNote, IonRefresher,
  IonRefresherContent
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
  return new Date(dateString).toLocaleDateString();
};

const handleRefresh = async (event) => {
  await transactionStore.fetchDashboardData();
  event.target.complete();
};

const deleteTransaction = async (id) => {
  await transactionStore.deleteTransaction(id);
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
</style>
