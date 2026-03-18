<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

// Demo credentials hint
const showDemoHint = computed(() => {
  return email.value === '' && password.value === '';
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password.';
    showErrorModal.value = true;
    return;
  }

  loading.value = true;
  
  const result = await authStore.login({
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value
  });

  loading.value = false;

  if (result.success) {
    router.push('/dashboard');
  } else {
    errorMessage.value = result.message || 'Invalid email or password. Please try again.';
    showErrorModal.value = true;
  }
};

const handleDemoLogin = async () => {
  loading.value = true;
  
  const result = await authStore.login({
    email: 'demo@finance.app',
    password: 'demo123',
    isDemo: true
  });

  loading.value = false;

  if (result.success) {
    router.push('/dashboard');
  } else {
    errorMessage.value = 'Demo login failed. Please try again.';
    showErrorModal.value = true;
  }
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  errorMessage.value = '';
};
</script>

<template>
  <div class="login-page">
    <div class="container">
      <div class="row justify-content-center min-vh-100 align-items-center">
        <div class="col-md-5 col-lg-4">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <div class="logo-circle mb-3">
                  <i class="bi bi-wallet2"></i>
                </div>
                <h2 class="fw-bold text-primary">Welcome Back</h2>
                <p class="text-muted">Sign in to manage your finances</p>
              </div>

              <!-- Demo Mode Banner -->
              <div v-if="showDemoHint" class="alert alert-info d-flex align-items-center mb-3">
                <i class="bi bi-info-circle-fill me-2"></i>
                <div class="small">
                  <strong>Demo Mode:</strong> Click "Try Demo" below or use any credentials from Mock_Users.csv
                </div>
              </div>

              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="email" class="form-label">Email address</label>
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    class="form-control form-control-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <div class="input-group">
                    <input
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control form-control-lg"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="mb-3 d-flex justify-content-between align-items-center">
                  <div class="form-check">
                    <input
                      id="rememberMe"
                      v-model="rememberMe"
                      type="checkbox"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <router-link to="/forgot-password" class="text-decoration-none small">
                    Forgot password?
                  </router-link>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100 btn-lg"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>

                <button
                  type="button"
                  class="btn btn-outline-primary w-100 btn-lg mt-2"
                  :disabled="loading"
                  @click="handleDemoLogin"
                >
                  <i class="bi bi-play-circle me-2"></i>Try Demo
                </button>
              </form>

              <div class="text-center mt-4">
                <p class="mb-0">
                  Don't have an account?
                  <router-link to="/register" class="text-primary text-decoration-none fw-semibold">
                    Sign up
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-danger text-white border-0">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Login Failed
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeErrorModal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-3">{{ errorMessage }}</p>
            <div class="alert alert-info mb-0">
              <i class="bi bi-lightbulb me-2"></i>
              <strong>Tip:</strong> Try the "Try Demo" button for quick access, or use credentials from Mock_Users.csv
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" @click="closeErrorModal">
              Close
            </button>
            <button type="button" class="btn btn-primary" @click="closeErrorModal">
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.logo-circle {
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
  border-radius: 20px;
}

.form-control {
  border-radius: 10px;
  border: 2px solid #e9ecef;
  padding: 12px 16px;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 600;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  transform: none;
  box-shadow: none;
}

.modal-content {
  border-radius: 15px;
}
</style>
