<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>AI Financial Advisor</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showPrivacyInfo" fill="clear" size="small">
            <ion-icon :icon="shieldCheckmarkOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" ref="contentRef">
      <!-- Chat Messages -->
      <div class="chat-container">
        <div v-for="(msg, index) in conversation" :key="index"
             :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
          <ion-card :color="msg.role === 'user' ? 'primary' : (msg.isError ? 'danger' : '')">
            <ion-card-content>
              <div v-if="msg.role === 'assistant'" class="ai-label">
                <ion-icon :icon="sparklesOutline"></ion-icon> AI Advisor
              </div>
              <p style="white-space: pre-wrap;">{{ msg.content }}</p>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-if="loading" class="ai-message">
          <ion-card>
            <ion-card-content>
              <ion-spinner name="dots"></ion-spinner>
              <span class="thinking-text">Thinking...</span>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-if="conversation.length === 0 && !loading" class="empty-state">
          <ion-icon :icon="chatbubblesOutline" class="empty-icon"></ion-icon>
          <p>Ask me anything about your finances!</p>
          <div class="suggestions">
            <ion-chip v-for="s in suggestedQuestions" :key="s" @click="sendSuggestion(s)">
              {{ s }}
            </ion-chip>
          </div>
        </div>
      </div>

      <!-- Clear conversation button -->
      <ion-button
        v-if="conversation.length > 0"
        expand="block"
        fill="outline"
        color="medium"
        size="small"
        class="ion-margin-top"
        @click="handleClearConversation"
      >
        <ion-icon :icon="trashOutline" slot="start"></ion-icon>
        Clear Conversation
      </ion-button>
    </ion-content>

    <!-- Input Area -->
    <ion-footer>
      <ion-toolbar>
        <ion-row class="ion-align-items-center ion-padding-horizontal">
          <ion-col>
            <ion-input
              v-model="inputText"
              placeholder="Ask about your finances..."
              @keyup.enter="sendMessage"
              fill="outline"
              :disabled="!hasAcceptedPrivacy"
            ></ion-input>
          </ion-col>
          <ion-col size="auto">
            <ion-button @click="sendMessage" :disabled="loading || !inputText.trim() || !hasAcceptedPrivacy" fill="clear">
              <ion-icon slot="icon-only" :icon="sendOutline"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-toolbar>
    </ion-footer>

    <!-- Privacy Agreement Modal -->
    <ion-modal :is-open="showPrivacyModal" :backdrop-dismiss="false">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Privacy & Data Usage</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              Important: Please read before continuing
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <h3>How We Use Your Financial Data</h3>
            <p>
              The AI Financial Advisor uses your personal financial data to provide
              <strong>personalized, actionable financial advice</strong>. By accepting this agreement,
              you consent to the following:
            </p>

            <ion-list lines="none">
              <ion-list-header>
                <ion-label color="success"><strong>What We Access:</strong></ion-label>
              </ion-list-header>
              <ion-item>
                <ion-label class="ion-text-wrap">• Your transaction history and spending patterns</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Income and expense summaries</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Category-wise spending breakdown</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Recent financial activities</ion-label>
              </ion-item>
            </ion-list>

            <ion-list lines="none">
              <ion-list-header>
                <ion-label color="primary"><strong>How AI Uses Your Data:</strong></ion-label>
              </ion-list-header>
              <ion-item>
                <ion-label class="ion-text-wrap">• Analyzes spending habits to identify saving opportunities</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Provides personalized budgeting recommendations</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Offers context-aware answers to financial questions</ion-label>
              </ion-item>
            </ion-list>

            <ion-list lines="none">
              <ion-list-header>
                <ion-label color="warning"><strong>Data Security & Privacy:</strong></ion-label>
              </ion-list-header>
              <ion-item>
                <ion-label class="ion-text-wrap">• Your data is encrypted and securely stored</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• AI processing through secure HKBU ChatGPT API</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• Information never shared with third parties</ion-label>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-wrap">• You can withdraw consent anytime</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" @click="acceptPrivacy" class="ion-margin-top">
          <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
          I Understand & Agree
        </ion-button>
        <ion-button expand="block" fill="outline" color="medium" @click="declinePrivacy" class="ion-margin-top">
          <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
          Decline
        </ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { aiAPI } from '@/api/index.js';
import {
  chatbubblesOutline, sendOutline, sparklesOutline, trashOutline,
  shieldCheckmarkOutline, informationCircleOutline, checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonFooter, IonRow, IonCol, IonInput, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner,
  IonChip, IonModal, IonList, IonListHeader, IonItem, IonLabel,
  IonButtons
} from '@ionic/vue';

const router = useRouter();
const conversation = ref([]);
const inputText = ref('');
const loading = ref(false);
const contentRef = ref(null);
const sessionId = ref(null);
const showPrivacyModal = ref(false);
const hasAcceptedPrivacy = ref(false);

const suggestedQuestions = [
  'How can I save more money?',
  'What should I do with my extra income?',
  'How can I reduce my expenses?',
  'Is my spending balanced?'
];

// Generate or retrieve session ID for conversation memory
const getSessionId = () => {
  let sid = localStorage.getItem('aiAdvisorSessionId');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('aiAdvisorSessionId', sid);
  }
  return sid;
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

const acceptPrivacy = () => {
  localStorage.setItem('aiAdvisorPrivacyAccepted', 'true');
  hasAcceptedPrivacy.value = true;
  showPrivacyModal.value = false;
  sessionId.value = getSessionId();
};

const declinePrivacy = () => {
  showPrivacyModal.value = false;
  router.replace('/tabs/dashboard');
};

const showPrivacyInfo = () => {
  showPrivacyModal.value = true;
};

const scrollToBottom = async () => {
  await nextTick();
  if (contentRef.value) {
    const el = contentRef.value.$el;
    el.scrollToBottom(300);
  }
};

const sendSuggestion = (text) => {
  inputText.value = text;
  sendMessage();
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  conversation.value.push({ role: 'user', content: text });
  inputText.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await aiAPI.getAdvice(text, sessionId.value);

    // Update session ID if server returned a new one
    if (response.data.sessionId) {
      sessionId.value = response.data.sessionId;
      localStorage.setItem('aiAdvisorSessionId', response.data.sessionId);
    }

    conversation.value.push({
      role: 'assistant',
      content: response.data.answer || response.data.message || 'No response.',
      timestamp: response.data.timestamp
    });
  } catch (error) {
    conversation.value.push({
      role: 'assistant',
      content: 'Sorry, I could not get a response. Please try again.',
      isError: true
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const handleClearConversation = async () => {
  try {
    if (sessionId.value) {
      await aiAPI.clearConversation(sessionId.value);
    }
  } catch (error) {
    console.error('Error clearing conversation on server:', error);
  }

  conversation.value = [];

  // Generate new session ID
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionId.value = newSessionId;
  localStorage.setItem('aiAdvisorSessionId', newSessionId);
};
</script>

<style scoped>
.chat-container {
  padding-bottom: 20px;
}
.message {
  margin: 8px 0;
}
.user-message {
  display: flex;
  justify-content: flex-end;
}
.user-message ion-card {
  max-width: 80%;
}
.ai-message ion-card {
  max-width: 85%;
}
.ai-label {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--ion-color-primary);
}
.thinking-text {
  margin-left: 8px;
  color: var(--ion-color-medium);
}
.empty-state {
  text-align: center;
  margin-top: 60px;
  color: var(--ion-color-medium);
}
.empty-icon {
  font-size: 64px;
  color: var(--ion-color-primary);
}
.suggestions {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
