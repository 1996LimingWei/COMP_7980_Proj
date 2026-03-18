<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  error.value = '';

  // Validation
  if (!name.value || !email.value || !password.value) {
    error.value = 'Please fill in all fields.';
    return;
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  loading.value = true;

  const result = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value
  });

  loading.value = false;

  if (result.success) {
    router.push('/dashboard');
  } else {
    error.value = result.message || 'Registration failed. Please try again.';
  }
};
</script>

<template>
  <div class="register-page">
    <div class="container">
      <div class="row justify-content-center min-vh-100 align-items-center">
        <div class="col-md-5 col-lg-4">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <div class="logo-circle mb-3">
                  <i class="bi bi-person-plus"></i>
                </div>
                <h2 class="fw-bold text-primary">Create Account</h2>
                <p class="text-muted">Start managing your finances today</p>
              </div>

              <div v-if="error" class="alert alert-danger" role="alert">
                {{ error }}
              </div>

              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="name" class="form-label">Full Name</label>
                  <input
                    id="name"
                    v-model="name"
                    type="text"
                    class="form-control form-control-lg"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

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
                  <input
                    id="password"
                    v-model="password"
                    type="password"
                    class="form-control form-control-lg"
                    placeholder="Create a password"
                    required
                  />
                  <div class="form-text">Must be at least 6 characters long.</div>
                </div>

                <div class="mb-4">
                  <label for="confirmPassword" class="form-label">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    type="password"
                    class="form-control form-control-lg"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100 btn-lg"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ loading ? 'Creating Account...' : 'Create Account' }}
                </button>
              </form>

              <div class="text-center mt-4">
                <p class="mb-0">
                  Already have an account?
                  <router-link to="/login" class="text-primary text-decoration-none fw-semibold">
                    Sign in
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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
</style>
