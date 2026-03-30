<script setup>
import { ref, onMounted } from 'vue';
import { aiAPI } from '@/api/index.js';

const question = ref('');
const conversation = ref([]);
const loading = ref(false);
const showPrivacyModal = ref(false);
const hasAcceptedPrivacy = ref(false);
const sessionId = ref(null);
const hasMemory = ref(false);

// Generate or retrieve session ID for conversation memory
const getSessionId = () => {
  let sid = localStorage.getItem('aiAdvisorSessionId');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('aiAdvisorSessionId', sid);
  }
  return sid;
};

const askQuestion = async () => {
  if (!question.value.trim()) return;

  const userQuestion = question.value.trim();
  conversation.value.push({ role: 'user', content: userQuestion });
  
  loading.value = true;
  question.value = '';

  try {
    // Use session ID for conversation memory
    const response = await aiAPI.getAdvice(userQuestion, sessionId.value);
    
    // Update session ID if server returned a new one
    if (response.data.sessionId) {
      sessionId.value = response.data.sessionId;
      localStorage.setItem('aiAdvisorSessionId', response.data.sessionId);
    }
    
    // Check if conversation has memory
    hasMemory.value = response.data.hasMemory || response.data.messageCount > 2;
    
    conversation.value.push({
      role: 'assistant',
      content: response.data.answer,
      timestamp: response.data.timestamp
    });
  } catch (error) {
    console.error('Error getting advice:', error);
    conversation.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again later.',
      isError: true
    });
  } finally {
    loading.value = false;
  }
};

const clearConversation = async () => {
  try {
    // Clear on server
    if (sessionId.value) {
      await aiAPI.clearConversation(sessionId.value);
    }
  } catch (error) {
    console.error('Error clearing conversation on server:', error);
  }
  
  // Clear locally
  conversation.value = [];
  hasMemory.value = false;
  
  // Generate new session ID
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionId.value = newSessionId;
  localStorage.setItem('aiAdvisorSessionId', newSessionId);
};

const acceptPrivacy = () => {
  localStorage.setItem('aiAdvisorPrivacyAccepted', 'true');
  hasAcceptedPrivacy.value = true;
  showPrivacyModal.value = false;
  
  // Initialize session ID when accepting privacy
  sessionId.value = getSessionId();
};

const declinePrivacy = () => {
  // Redirect to dashboard or show message that AI advisor cannot be used
  alert('AI Financial Advisor requires consent to use your financial data for personalized advice. You will be redirected to the Dashboard.');
  window.location.href = '/dashboard';
};

const showPrivacyInfo = () => {
  showPrivacyModal.value = true;
};

onMounted(() => {
  const accepted = localStorage.getItem('aiAdvisorPrivacyAccepted');
  if (!accepted) {
    showPrivacyModal.value = true;
  } else {
    hasAcceptedPrivacy.value = true;
    sessionId.value = getSessionId();
  }
});

const suggestedQuestions = [
  'How can I save more money?',
  'What should I do with my extra income?',
  'How can I reduce my expenses?',
  'Is my spending balanced?'
];
</script>

<template>
  <div class="ai-advice-page py-4">
    <!-- Privacy Agreement Modal -->
    <div v-if="showPrivacyModal" class="privacy-modal-overlay">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-shield-check me-2"></i>
              Privacy & Data Usage Agreement
            </h5>
          </div>
          <div class="modal-body p-4" style="background-color: #ffffff; color: #000000;">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Important: Please read before continuing</strong>
            </div>
            
            <h6 class="fw-bold mb-3">How We Use Your Financial Data</h6>
            <p class="mb-3">
              The AI Financial Advisor uses your personal financial data to provide 
              <strong>personalized, actionable financial advice</strong>. By accepting this agreement, 
              you consent to the following:
            </p>
            
            <div class="card bg-light border-0 mb-3">
              <div class="card-body">
                <h6 class="fw-semibold"><i class="bi bi-check-circle text-success me-2"></i>What We Access:</h6>
                <ul class="mb-0 ps-3">
                  <li>Your transaction history and spending patterns</li>
                  <li>Income and expense summaries</li>
                  <li>Category-wise spending breakdown</li>
                  <li>Recent financial activities</li>
                </ul>
              </div>
            </div>
            
            <div class="card bg-light border-0 mb-3">
              <div class="card-body">
                <h6 class="fw-semibold"><i class="bi bi-robot text-primary me-2"></i>How AI Uses Your Data:</h6>
                <ul class="mb-0 ps-3">
                  <li>Analyzes your spending habits to identify saving opportunities</li>
                  <li>Provides personalized budgeting recommendations</li>
                  <li>Offers context-aware answers to your financial questions</li>
                  <li>Generates tailored advice based on your financial behavior</li>
                </ul>
              </div>
            </div>
            
            <div class="card bg-light border-0 mb-3">
              <div class="card-body">
                <h6 class="fw-semibold"><i class="bi bi-lock text-warning me-2"></i>Data Security & Privacy:</h6>
                <ul class="mb-0 ps-3">
                  <li>Your data is encrypted and securely stored</li>
                  <li>AI processing happens through secure HKBU ChatGPT API</li>
                  <li>Your information is never shared with third parties</li>
                  <li>You can withdraw consent anytime by clearing your data</li>
                </ul>
              </div>
            </div>
            
            <div class="alert alert-warning mb-0">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Note:</strong> If you do not consent to using your financial data, 
              the AI Advisor cannot provide personalized advice. You will be redirected to the Dashboard.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="declinePrivacy">
              <i class="bi bi-x-circle me-2"></i>Decline
            </button>
            <button type="button" class="btn btn-primary" @click="acceptPrivacy">
              <i class="bi bi-check-circle me-2"></i>I Understand & Agree
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content - Always render but disable interactions when privacy not accepted -->
    <div class="container" :style="!hasAcceptedPrivacy ? 'pointer-events: none; filter: blur(2px);' : ''">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="ai-icon mb-3">
              <i class="bi bi-robot"></i>
            </div>
            <h2 class="fw-bold">AI Financial Advisor</h2>
            <p class="text-muted">Ask me anything about your finances</p>
            <button 
              class="btn btn-sm btn-link text-muted mt-2" 
              @click="showPrivacyInfo"
              title="View Privacy Agreement"
            >
              <i class="bi bi-shield-check me-1"></i>
              Privacy & Data Usage
            </button>
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
              <div>
                <h5 class="mb-0">Conversation</h5>
                <small v-if="hasMemory" class="text-success">
                  <i class="bi bi-memory me-1"></i>AI remembers our previous conversation
                </small>
              </div>
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

/* Privacy Modal Overlay */
.privacy-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  border-radius: 15px;
  border: none;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  max-width: 900px;
  width: 100%;
  animation: slideUp 0.3s ease-out;
  background-color: #ffffff;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  border-radius: 15px 15px 0 0;
  border-bottom: none;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
  color: #212529;
}

.modal-body h6,
.modal-body p,
.modal-body strong,
.modal-body li {
  color: #212529;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}
</style>
