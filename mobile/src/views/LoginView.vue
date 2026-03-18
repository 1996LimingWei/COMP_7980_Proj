<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <ion-icon :icon="walletOutline" class="logo-icon"></ion-icon>
          <h1>FinanceApp</h1>
          <p>Manage your finances</p>
        </div>

        <form @submit.prevent="handleLogin">
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input v-model="email" type="email" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Password</ion-label>
            <ion-input v-model="password" type="password" required></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" class="ion-margin-top" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Sign In</span>
          </ion-button>
        </form>

        <ion-button expand="block" fill="clear" router-link="/register">
          Don't have an account? Sign up
        </ion-button>
      </div>

      <!-- Error Alert -->
      <ion-alert
        :is-open="showError"
        header="Login Failed"
        :message="errorMessage"
        :buttons="['OK']"
        @didDismiss="showError = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { walletOutline } from 'ionicons/icons';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  const result = await authStore.login({ email: email.value, password: password.value });
  loading.value = false;

  if (result.success) {
    router.replace('/tabs/dashboard');
  } else {
    errorMessage.value = result.message || 'Invalid email or password.';
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
