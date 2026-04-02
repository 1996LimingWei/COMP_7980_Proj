<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>All Transactions</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filter Segment -->
      <ion-segment v-model="filter" class="ion-margin-bottom">
        <ion-segment-button value="all">
          <ion-label>All</ion-label>
        </ion-segment-button>
        <ion-segment-button value="income">
          <ion-label>Income</ion-label>
        </ion-segment-button>
        <ion-segment-button value="expense">
          <ion-label>Expenses</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Transactions List -->
      <ion-list>
        <ion-item-sliding v-for="t in filteredTransactions" :key="t._id">
          <ion-item>
            <ion-label>
              <h3>{{ t.category }}</h3>
              <p>{{ t.description || 'No description' }}</p>
              <p class="transaction-date">{{ formatDate(t.date) }}</p>
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

        <ion-item v-if="filteredTransactions.length === 0 && !transactionStore.loading">
          <ion-label class="ion-text-center">
            <p>No transactions found.</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Loading -->
      <div v-if="transactionStore.loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';
import { trashOutline } from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
  IonLabel, IonNote, IonIcon, IonSegment, IonSegmentButton,
  IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/vue';

const transactionStore = useTransactionStore();
const filter = ref('all');

onMounted(() => {
  transactionStore.fetchTransactions();
});

const filteredTransactions = computed(() => {
  if (filter.value === 'income') {
    return transactionStore.transactions.filter(t => t.amount > 0);
  }
  if (filter.value === 'expense') {
    return transactionStore.transactions.filter(t => t.amount < 0);
  }
  return transactionStore.transactions;
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const handleRefresh = async (event) => {
  await transactionStore.fetchTransactions();
  event.target.complete();
};

const deleteTransaction = async (id) => {
  await transactionStore.deleteTransaction(id);
  await transactionStore.fetchTransactions();
};
</script>

<style scoped>
.transaction-date {
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>
