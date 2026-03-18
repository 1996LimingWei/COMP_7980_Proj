<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard" href="/tabs/dashboard">
          <ion-icon :icon="homeOutline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="add" href="/tabs/add">
          <ion-icon :icon="addCircleOutline"></ion-icon>
          <ion-label>Add</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="ai" href="/tabs/ai">
          <ion-icon :icon="chatbubblesOutline"></ion-icon>
          <ion-label>AI</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline"></ion-icon>
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue';
import { homeOutline, addCircleOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
</script>
