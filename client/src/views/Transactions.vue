<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transactions.js'

const transactionStore = useTransactionStore()

// Search and filter state
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Available categories for filter
const categories = [
  'All',
  'Food & Dining',
  'Shopping',
  'Bills & Utilities',
  'Transport',
  'Healthcare',
  'Entertainment',
  'Income',
  'Transfer',
  'Other'
]
const selectedCategory = ref('All')

// Edit modal state
const showEditModal = ref(false)
const editingTransaction = ref(null)
const editForm = ref({
  amount: '',
  category: '',
  description: '',
  date: ''
})
const editError = ref('')
const editLoading = ref(false)

onMounted(() => {
  fetchTransactions()
})

// Watch for search query changes with debounce
let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchTransactions()
  }, 300)
})

// Watch for category filter changes
watch(selectedCategory, () => {
  currentPage.value = 1
  fetchTransactions()
})

const fetchTransactions = async () => {
  const params = {
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value || undefined,
    category: selectedCategory.value === 'All' ? undefined : selectedCategory.value
  }
  await transactionStore.fetchTransactions(params)
}

const goToPage = (page) => {
  if (page >= 1 && page <= transactionStore.pagination.pages) {
    currentPage.value = page
    fetchTransactions()
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const editTransaction = (t) => {
  editingTransaction.value = t
  editForm.value = {
    amount: Math.abs(t.amount),
    type: t.amount > 0 ? 'income' : 'expense',
    category: t.category,
    description: t.description || '',
    date: new Date(t.date).toISOString().split('T')[0]
  }
  editError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingTransaction.value = null
  editError.value = ''
}

const saveEdit = async () => {
  if (!editForm.value.amount || editForm.value.amount === 0) {
    editError.value = 'Amount is required and cannot be zero'
    return
  }
  if (!editForm.value.category) {
    editError.value = 'Category is required'
    return
  }

  editLoading.value = true
  editError.value = ''

  try {
    const amount = editForm.value.type === 'income' 
      ? Math.abs(parseFloat(editForm.value.amount))
      : -Math.abs(parseFloat(editForm.value.amount))

    await transactionStore.updateTransaction(editingTransaction.value._id, {
      amount,
      category: editForm.value.category,
      description: editForm.value.description,
      date: editForm.value.date
    })

    closeEditModal()
    await fetchTransactions()
  } catch (error) {
    editError.value = error.message || 'Failed to update transaction'
  } finally {
    editLoading.value = false
  }
}

const deleteTransaction = async (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    await transactionStore.deleteTransaction(id)
    await fetchTransactions()
  }
}
</script>

<template>
  <div class="container mt-4">
    <h2 class="fw-bold mb-4">All Transactions</h2>

    <!-- Search and Filter Bar -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3">
          <!-- Search Input -->
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-white">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Search by description, category, or amount..."
              />
              <button
                v-if="searchQuery"
                class="btn btn-outline-secondary"
                type="button"
                @click="searchQuery = ''; fetchTransactions()"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="col-md-6">
            <select v-model="selectedCategory" class="form-select">
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat === 'All' ? 'All Categories' : cat }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card shadow border-0 mb-4">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
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
              <tr v-for="t in transactionStore.transactions" :key="t._id">
                <td>{{ formatDate(t.date) }}</td>
                <td>
                  <span class="badge bg-secondary">{{ t.category }}</span>
                </td>
                <td>{{ t.description || '-' }}</td>
                <td class="text-end" :class="t.amount > 0 ? 'text-success' : 'text-danger'">
                  {{ t.amount > 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editTransaction(t)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteTransaction(t._id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="transactionStore.transactions.length === 0">
                <td colspan="5" class="text-center text-muted py-4">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  No transactions found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="transactionStore.pagination.pages > 1" aria-label="Transaction pagination">
      <ul class="pagination justify-content-center">
        <!-- Previous Button -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
            <i class="bi bi-chevron-left"></i> Previous
          </button>
        </li>

        <!-- Page Numbers -->
        <li
          v-for="page in transactionStore.pagination.pages"
          :key="page"
          class="page-item"
          :class="{ active: page === currentPage }"
        >
          <button class="page-link" @click="goToPage(page)">{{ page }}</button>
        </li>

        <!-- Next Button -->
        <li class="page-item" :class="{ disabled: currentPage === transactionStore.pagination.pages }">
          <button
            class="page-link"
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === transactionStore.pagination.pages"
          >
            Next <i class="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Page Info -->
    <div class="text-center text-muted mt-2">
      <small>
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} -
        {{ Math.min(currentPage * itemsPerPage, transactionStore.pagination.total) }}
        of {{ transactionStore.pagination.total }} transactions
      </small>
    </div>

    <!-- Edit Transaction Modal -->
    <div
      v-if="showEditModal"
      class="modal fade show"
      style="display: block; background-color: rgba(0,0,0,0.5);"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Transaction</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <!-- Error Alert -->
            <div v-if="editError" class="alert alert-danger alert-dismissible fade show">
              {{ editError }}
              <button type="button" class="btn-close" @click="editError = ''"></button>
            </div>

            <form @submit.prevent="saveEdit">
              <!-- Type Selection -->
              <div class="mb-3">
                <label class="form-label">Type</label>
                <div class="btn-group w-100" role="group">
                  <input
                    type="radio"
                    class="btn-check"
                    id="edit-expense"
                    value="expense"
                    v-model="editForm.type"
                  />
                  <label class="btn btn-outline-danger" for="edit-expense">
                    <i class="bi bi-arrow-down-circle me-1"></i>Expense
                  </label>

                  <input
                    type="radio"
                    class="btn-check"
                    id="edit-income"
                    value="income"
                    v-model="editForm.type"
                  />
                  <label class="btn btn-outline-success" for="edit-income">
                    <i class="bi bi-arrow-up-circle me-1"></i>Income
                  </label>
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label for="edit-amount" class="form-label">Amount</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    class="form-control"
                    id="edit-amount"
                    v-model="editForm.amount"
                    required
                  />
                </div>
              </div>

              <!-- Category -->
              <div class="mb-3">
                <label for="edit-category" class="form-label">Category</label>
                <select class="form-select" id="edit-category" v-model="editForm.category" required>
                  <option v-for="cat in categories.filter(c => c !== 'All')" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <!-- Description -->
              <div class="mb-3">
                <label for="edit-description" class="form-label">Description</label>
                <input
                  type="text"
                  class="form-control"
                  id="edit-description"
                  v-model="editForm.description"
                  placeholder="Enter description (optional)"
                />
              </div>

              <!-- Date -->
              <div class="mb-3">
                <label for="edit-date" class="form-label">Date</label>
                <input
                  type="date"
                  class="form-control"
                  id="edit-date"
                  v-model="editForm.date"
                  required
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveEdit"
              :disabled="editLoading"
            >
              <span v-if="editLoading" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-check-lg me-1"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table th {
 font-weight: 600;
 color: #6c757d;
}

.modal.show {
  display: block;
}
</style>