<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- User Info Card -->
      <ion-card>
        <ion-card-content class="ion-text-center">
          <ion-avatar class="profile-avatar">
            <ion-icon :icon="personCircleOutline" class="avatar-icon"></ion-icon>
          </ion-avatar>
          <h2>{{ authStore.userData?.name || 'User' }}</h2>
          <p>{{ authStore.userData?.email }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Account Stats -->
      <ion-card v-if="transactionStore.summary">
        <ion-card-header>
          <ion-card-title>Account Summary</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>Total Balance</ion-label>
              <ion-note slot="end" :color="transactionStore.netBalance >= 0 ? 'success' : 'danger'">
                {{ formatCurrency(transactionStore.netBalance) }}
              </ion-note>
            </ion-item>
            <ion-item>
              <ion-label>This Month Income</ion-label>
              <ion-note slot="end" color="success">
                {{ formatCurrency(transactionStore.totalIncome) }}
              </ion-note>
            </ion-item>
            <ion-item>
              <ion-label>This Month Expense</ion-label>
              <ion-note slot="end" color="danger">
                {{ formatCurrency(transactionStore.totalExpense) }}
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Settings List -->
      <ion-list>
        <ion-list-header>
          <ion-label>Settings</ion-label>
        </ion-list-header>
        <ion-item button @click="confirmLogout">
          <ion-icon slot="start" :icon="logOutOutline" color="danger"></ion-icon>
          <ion-label color="danger">Sign Out</ion-label>
        </ion-item>
      </ion-list>

      <ion-alert
        :is-open="showLogoutConfirm"
        header="Sign Out"
        message="Are you sure you want to sign out?"
        :buttons="logoutButtons"
        @didDismiss="showLogoutConfirm = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { useTransactionStore } from '@/stores/transactions.js';
import { personCircleOutline, logOutOutline } from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonListHeader, IonItem, IonLabel, IonNote,
  IonIcon, IonAvatar, IonAlert
} from '@ionic/vue';

const router = useRouter();
const authStore = useAuthStore();
const transactionStore = useTransactionStore();
const showLogoutConfirm = ref(false);

onMounted(() => {
  transactionStore.fetchDashboardData();
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

const confirmLogout = () => {
  showLogoutConfirm.value = true;
};

const logoutButtons = [
  { text: 'Cancel', role: 'cancel' },
  {
    text: 'Sign Out',
    role: 'destructive',
    handler: () => {
      authStore.logout();
      router.replace('/login');
    }
  }
];
</script>

<style scoped>
.profile-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: var(--ion-color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-icon {
  font-size: 60px;
  color: var(--ion-color-primary);
}
</style>
