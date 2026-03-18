<script setup>
import { ref } from 'vue';
import { aiAPI } from '@/api/index.js';

const question = ref('');
const conversation = ref([]);
const loading = ref(false);
const includeContext = ref(true);

const askQuestion = async () => {
  if (!question.value.trim()) return;

  const userQuestion = question.value.trim();
  conversation.value.push({ role: 'user', content: userQuestion });
  
  loading.value = true;
  question.value = '';

  try {
    const response = await aiAPI.getAdvice(userQuestion, includeContext.value);
    conversation.value.push({
      role: 'assistant',
      content: response.data.answer,
      timestamp: response.data.timestamp
    });
  } catch (error) {
    conversation.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again later.',
      isError: true
    });
  } finally {
    loading.value = false;
  }
};

const clearConversation = () => {
  conversation.value = [];
};

const suggestedQuestions = [
  'How can I save more money?',
  'What should I do with my extra income?',
  'How can I reduce my expenses?',
  'Is my spending balanced?'
];
</script>

<template>
  <div class="ai-advice-page py-4">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="ai-icon mb-3">
              <i class="bi bi-robot"></i>
            </div>
            <h2 class="fw-bold">AI Financial Advisor</h2>
            <p class="text-muted">Ask me anything about your finances</p>
          </div>

          <!-- Settings -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <div class="form-check">
                <input
                  id="includeContext"
                  v-model="includeContext"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="includeContext">
                  Include my financial data for personalized advice
                </label>
              </div>
            </div>
          </div>

          <!-- Suggested Questions -->
          <div v-if="conversation.length === 0" class="mb-4">
            <p class="text-muted mb-2">Try asking:</p>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="q in suggestedQuestions"
                :key="q"
                class="btn btn-outline-primary btn-sm"
                @click="question = q; askQuestion()"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <!-- Conversation -->
          <div v-if="conversation.length > 0" class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Conversation</h5>
              <button class="btn btn-sm btn-outline-secondary" @click="clearConversation">
                <i class="bi bi-trash me-1"></i>Clear
              </button>
            </div>
            <div class="card-body conversation-body">
              <div
                v-for="(msg, index) in conversation"
                :key="index"
                class="mb-3"
                :class="msg.role === 'user' ? 'text-end' : ''"
              >
                <div
                  class="d-inline-block p-3 rounded-3"
                  :class="msg.role === 'user' ? 'bg-primary text-white' : (msg.isError ? 'bg-danger bg-opacity-10 text-danger' : 'bg-light')"
                  style="max-width: 80%; text-align: left;"
                >
                  <div v-if="msg.role === 'assistant'" class="fw-semibold mb-1">
                    <i class="bi bi-robot me-1"></i>AI Advisor
                  </div>
                  <div style="white-space: pre-wrap;">{{ msg.content }}</div>
                </div>
              </div>
              <div v-if="loading" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <form @submit.prevent="askQuestion">
                <div class="input-group">
                  <input
                    v-model="question"
                    type="text"
                    class="form-control form-control-lg"
                    placeholder="Type your question..."
                    :disabled="loading"
                  />
                  <button
                    type="submit"
                    class="btn btn-primary px-4"
                    :disabled="loading || !question.trim()"
                  >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-send"></i>
                    {{ loading ? 'Thinking...' : 'Ask' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-advice-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.ai-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2.5rem;
  color: white;
}

.card {
  border-radius: 15px;
}

.conversation-body {
  max-height: 500px;
  overflow-y: auto;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
</style>
