<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const showNavbar = computed(() => !route.meta.guestOnly);

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div id="app">
    <!-- Navigation -->
    <nav v-if="showNavbar" class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <router-link class="navbar-brand fw-bold" to="/dashboard">
          <i class="bi bi-wallet2 me-2"></i>FinanceApp
        </router-link>
        
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div id="navbarNav" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/dashboard" active-class="active">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/ai-advice" active-class="active">
                <i class="bi bi-robot me-1"></i>AI Advice
              </router-link>
            </li>
          </ul>
          
          <ul class="navbar-nav">
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i class="bi bi-person-circle me-1"></i>
                {{ authStore.user?.name || 'User' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <router-link class="dropdown-item" to="/profile">
                    <i class="bi bi-person me-2"></i>Profile
                  </router-link>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item text-danger" href="#" @click.prevent="logout">
                    <i class="bi bi-box-arrow-right me-2"></i>Logout
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'bootstrap-icons/font/bootstrap-icons.css';

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.navbar-brand {
  font-size: 1.5rem;
}

.nav-link {
  font-weight: 500;
}

.nav-link.active {
  color: #fff !important;
}
</style>
