<script setup>
import { onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions.js'

const transactionStore = useTransactionStore()

onMounted(() => {
 transactionStore.fetchTransactions()
})

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
}
const deleteTransaction = async (id) => {
 if (confirm('Are you sure you want to delete this transaction?')) {
   await transactionStore.deleteTransaction(id)
   await transactionStore.fetchTransactions()
 }
}
</script>

<template>
 <div class="container mt-4">
   <h2 class="fw-bold mb-4">All Transactions</h2>
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
               <td>{{ t.description }}</td>
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
                 No transactions found.
               </td>
             </tr>
           </tbody>
         </table>
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
</style>