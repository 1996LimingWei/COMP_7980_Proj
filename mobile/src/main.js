import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';

import { IonicVue } from '@ionic/vue';

/* Ionic CSS (v8) */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/ionic.bundle.css';

const app = createApp(App);

app.use(IonicVue);
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
    app.mount('#app');
});
