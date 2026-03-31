<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Transaction</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-content>
          <!-- Type Toggle -->
          <ion-segment v-model="form.type" class="ion-margin-bottom">
            <ion-segment-button value="expense">
              <ion-label>Expense</ion-label>
            </ion-segment-button>
            <ion-segment-button value="income">
              <ion-label>Income</ion-label>
            </ion-segment-button>
          </ion-segment>

          <ion-input
            label="Amount"
            label-placement="floating"
            fill="outline"
            v-model="form.amount"
            type="number"
            min="0"
            step="0.01"
            required
            class="ion-margin-bottom"
          ></ion-input>

          <ion-select
            label="Category"
            label-placement="floating"
            fill="outline"
            v-model="form.category"
            class="ion-margin-bottom"
          >
            <ion-select-option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </ion-select-option>
          </ion-select>

          <ion-input
            label="Description"
            label-placement="floating"
            fill="outline"
            v-model="form.description"
            type="text"
            class="ion-margin-bottom"
          ></ion-input>

          <ion-input
            label="Date"
            label-placement="floating"
            fill="outline"
            v-model="form.date"
            type="date"
            class="ion-margin-bottom"
          ></ion-input>

          <ion-button expand="block" @click="handleSubmit" :disabled="loading" class="ion-margin-top">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Add Transaction</span>
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="showSuccess"
        message="Transaction added successfully!"
        :duration="2000"
        color="success"
        @didDismiss="showSuccess = false"
      ></ion-toast>

      <ion-alert
        :is-open="showError"
        header="Error"
        :message="errorMessage"
        :buttons="['OK']"
        @didDismiss="showError = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonInput, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonSpinner,
  IonToast, IonAlert
} from '@ionic/vue';

const transactionStore = useTransactionStore();

const categories = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Fitness', 'Bills & Utilities', 'Education', 'Travel',
  'Income', 'Investment', 'Other'
];

const today = new Date().toISOString().split('T')[0];

const form = ref({
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: today
});

const loading = ref(false);
const showSuccess = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  if (!form.value.amount || !form.value.category) {
    errorMessage.value = 'Please fill in amount and category.';
    showError.value = true;
    return;
  }

  loading.value = true;
  const amount = form.value.type === 'expense'
    ? -Math.abs(parseFloat(form.value.amount))
    : Math.abs(parseFloat(form.value.amount));

  const result = await transactionStore.createTransaction({
    amount,
    category: form.value.category,
    description: form.value.description,
    date: form.value.date
  });

  loading.value = false;

  if (result.success) {
    showSuccess.value = true;
    form.value = { type: 'expense', amount: '', category: '', description: '', date: today };
  } else {
    errorMessage.value = result.message || 'Failed to add transaction.';
    showError.value = true;
  }
};
</script>
