import { createRouter, createWebHistory } from '@ionic/vue-router';
import { useAuthStore } from '@/stores/auth.js';

// Views
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import TabsView from '@/views/TabsView.vue';
import DashboardView from '@/views/DashboardView.vue';
import TransactionsView from '@/views/TransactionsView.vue';
import AddTransactionView from '@/views/AddTransactionView.vue';
import AIAdviceView from '@/views/AIAdviceView.vue';
import ProfileView from '@/views/ProfileView.vue';

const routes = [
    {
        path: '/',
        redirect: '/tabs/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { guestOnly: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView,
        meta: { guestOnly: true }
    },
    {
        path: '/tabs',
        component: TabsView,
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                component: DashboardView
            },
            {
                path: 'transactions',
                component: TransactionsView
            },
            {
                path: 'add',
                component: AddTransactionView
            },
            {
                path: 'ai',
                component: AIAdviceView
            },
            {
                path: 'profile',
                component: ProfileView
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
        return;
    }

    if (to.meta.guestOnly && isAuthenticated) {
        next('/tabs/dashboard');
        return;
    }

    next();
});

export default router;
