<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <ion-icon :icon="walletOutline" class="logo-icon"></ion-icon>
          <h1>FinanceApp</h1>
          <p>Manage your finances</p>
        </div>

        <!-- Demo Mode Hint -->
        <ion-card v-if="!email && !password" color="light" class="ion-margin-bottom">
          <ion-card-content>
            <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
            <strong> Demo Mode:</strong> Tap "Try Demo" below for quick access.
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <ion-input
              label="Email"
              label-placement="floating"
              fill="outline"
              v-model="email"
              type="email"
              required
              class="ion-margin-bottom"
            ></ion-input>

            <ion-input
              label="Password"
              label-placement="floating"
              fill="outline"
              v-model="password"
              type="password"
              required
              class="ion-margin-bottom"
            ></ion-input>

            <ion-button expand="block" @click="handleLogin" :disabled="loading" class="ion-margin-top">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Sign In</span>
            </ion-button>

            <ion-button expand="block" fill="outline" @click="handleDemoLogin" :disabled="loading" class="ion-margin-top">
              <ion-icon :icon="playCircleOutline" slot="start"></ion-icon>
              Try Demo
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" fill="clear" router-link="/register">
          Don't have an account? Sign up
        </ion-button>
      </div>

      <ion-alert
        :is-open="showError"
        header="Login Failed"
        :message="errorMessage"
        :buttons="errorButtons"
        @didDismiss="showError = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { walletOutline, informationCircleOutline, playCircleOutline } from 'ionicons/icons';
import {
  IonPage, IonContent, IonCard, IonCardContent,
  IonInput, IonButton, IonSpinner, IonAlert, IonIcon
} from '@ionic/vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const errorButtons = [
  { text: 'OK', role: 'cancel' }
];

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password.';
    showError.value = true;
    return;
  }

  loading.value = true;
  const result = await authStore.login({ email: email.value, password: password.value });
  loading.value = false;

  if (result.success) {
    router.replace('/tabs/dashboard');
  } else {
    errorMessage.value = result.message || 'Invalid email or password. Please try again.';
    showError.value = true;
  }
};

const handleDemoLogin = async () => {
  loading.value = true;
  const result = await authStore.login({
    email: 'demo@finance.app',
    password: 'demo123',
    isDemo: true
  });
  loading.value = false;

  if (result.success) {
    router.replace('/tabs/dashboard');
  } else {
    errorMessage.value = 'Demo login failed. Please try again.';
    showError.value = true;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 80px;
  color: var(--ion-color-primary);
}

.logo-section h1 {
  margin: 10px 0 5px;
  font-size: 28px;
  font-weight: bold;
}

.logo-section p {
  margin: 0;
  color: var(--ion-color-medium);
}
</style>
