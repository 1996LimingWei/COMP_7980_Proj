<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="register-container">
        <div class="logo-section">
          <ion-icon :icon="walletOutline" class="logo-icon"></ion-icon>
          <h1>Create Account</h1>
          <p>Start managing your finances</p>
        </div>

        <ion-card>
          <ion-card-content>
            <ion-input
              label="Full Name"
              label-placement="floating"
              fill="outline"
              v-model="name"
              type="text"
              required
              class="ion-margin-bottom"
            ></ion-input>

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

            <ion-input
              label="Confirm Password"
              label-placement="floating"
              fill="outline"
              v-model="confirmPassword"
              type="password"
              required
              class="ion-margin-bottom"
            ></ion-input>

            <ion-note color="medium" class="ion-margin-bottom" style="display: block;">
              Password must be at least 6 characters long.
            </ion-note>

            <ion-button expand="block" @click="handleRegister" :disabled="loading" class="ion-margin-top">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Create Account</span>
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" fill="clear" router-link="/login">
          Already have an account? Sign in
        </ion-button>
      </div>

      <ion-alert
        :is-open="showError"
        header="Registration Failed"
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
import {
  IonPage, IonContent, IonCard, IonCardContent,
  IonInput, IonButton, IonSpinner, IonAlert, IonIcon, IonNote
} from '@ionic/vue';

const router = useRouter();
const authStore = useAuthStore();
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const handleRegister = async () => {
  // Validation
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.';
    showError.value = true;
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.';
    showError.value = true;
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    showError.value = true;
    return;
  }

  loading.value = true;
  const result = await authStore.register({ name: name.value, email: email.value, password: password.value });
  loading.value = false;
  if (result.success) {
    router.replace('/tabs/dashboard');
  } else {
    errorMessage.value = result.message || 'Registration failed. Please try again.';
    showError.value = true;
  }
};
</script>

<style scoped>
.register-container {
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
