<script setup>
import { ref, watch } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const transactionStore = useTransactionStore();

const amount = ref('');
const category = ref('');
const description = ref('');
const date = ref(new Date().toISOString().split('T')[0]);
const loading = ref(false);
const error = ref('');

const categories = [
  'Food & Dining',
  'Shopping',
  'Bills & Utilities',
  'Transport',
  'Healthcare',
  'Entertainment',
  'Income',
  'Transfer',
  'Other'
];

// Populate form if editing
watch(() => props.transaction, (newVal) => {
  if (newVal) {
    amount.value = Math.abs(newVal.amount);
    category.value = newVal.category;
    description.value = newVal.description || '';
    date.value = new Date(newVal.date).toISOString().split('T')[0];
  }
}, { immediate: true });

const handleSubmit = async () => {
  error.value = '';

  if (!amount.value || !category.value || !date.value) {
    error.value = 'Please fill in all required fields.';
    return;
  }

  loading.value = true;

  const transactionData = {
    amount: parseFloat(amount.value),
    category: category.value,
    description: description.value,
    date: date.value
  };

  let result;
  if (props.transaction) {
    result = await transactionStore.updateTransaction(props.transaction._id, transactionData);
  } else {
    result = await transactionStore.createTransaction(transactionData);
  }

  loading.value = false;

  if (result.success) {
    emit('saved');
  } else {
    error.value = result.message;
  }
};

const close = () => {
  emit('close');
};
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">
            {{ transaction ? 'Edit Transaction' : 'Add Transaction' }}
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body">
          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">Amount</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  v-model="amount"
                  type="number"
                  step="0.01"
                  class="form-control"
                  placeholder="0.00"
                  required
                />
              </div>
              <div class="form-text">Use positive for income, negative for expense.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Category</label>
              <select v-model="category" class="form-select" required>
                <option value="">Select a category</option>
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <input
                v-model="description"
                type="text"
                class="form-control"
                placeholder="Optional description"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Date</label>
              <input
                v-model="date"
                type="date"
                class="form-control"
                required
              />
            </div>

            <div class="d-flex gap-2">
              <button type="button" class="btn btn-secondary flex-fill" @click="close">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary flex-fill" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ transaction ? 'Update' : 'Add' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  border-radius: 15px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
</style>
