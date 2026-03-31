<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>AI Financial Advice</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" ref="contentRef">
      <!-- Chat Messages -->
      <div class="chat-container">
        <div v-for="(msg, index) in messages" :key="index"
             :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
          <ion-card :color="msg.role === 'user' ? 'primary' : ''">
            <ion-card-content>
              <p>{{ msg.content }}</p>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-if="loading" class="ai-message">
          <ion-card>
            <ion-card-content>
              <ion-spinner name="dots"></ion-spinner>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-if="messages.length === 0 && !loading" class="empty-state">
          <ion-icon :icon="chatbubblesOutline" class="empty-icon"></ion-icon>
          <p>Ask me anything about your finances!</p>
          <div class="suggestions">
            <ion-chip v-for="s in suggestions" :key="s" @click="sendSuggestion(s)">
              {{ s }}
            </ion-chip>
          </div>
        </div>
      </div>
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
            ></ion-input>
          </ion-col>
          <ion-col size="auto">
            <ion-button @click="sendMessage" :disabled="loading || !inputText.trim()" fill="clear">
              <ion-icon slot="icon-only" :icon="sendOutline"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { aiAPI } from '@/api/index.js';
import { chatbubblesOutline, sendOutline } from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonFooter, IonRow, IonCol, IonInput, IonButton, IonIcon,
  IonCard, IonCardContent, IonSpinner, IonChip
} from '@ionic/vue';

const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const contentRef = ref(null);

const suggestions = [
  'How am I spending this month?',
  'Give me saving tips',
  'Analyze my top expenses',
  'How to improve my finances?'
];

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

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await aiAPI.getAdvice(text, true);
    messages.value.push({
      role: 'assistant',
      content: response.data.advice || response.data.message || 'No response.'
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I could not get a response. Please try again.'
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
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
