<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';

const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const loading = ref(false);
const message = ref('');
const messageType = ref('');

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name;
    email.value = authStore.user.email;
  }
});

const updateProfile = async () => {
  loading.value = true;
  message.value = '';

  const result = await authStore.updateProfile({
    name: name.value,
    email: email.value
  });

  loading.value = false;

  if (result.success) {
    message.value = 'Profile updated successfully!';
    messageType.value = 'success';
  } else {
    message.value = result.message;
    messageType.value = 'danger';
  }

  setTimeout(() => {
    message.value = '';
  }, 3000);
};

const logout = () => {
  authStore.logout();
  window.location.href = '/login';
};
</script>

<template>
  <div class="profile-page py-4">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <div class="profile-avatar mb-3">
                  <i class="bi bi-person-circle"></i>
                </div>
                <h2 class="fw-bold">My Profile</h2>
                <p class="text-muted">Manage your account settings</p>
              </div>

              <div v-if="message" :class="`alert alert-${messageType}`" role="alert">
                {{ message }}
              </div>

              <form @submit.prevent="updateProfile">
                <div class="mb-3">
                  <label for="name" class="form-label">Full Name</label>
                  <input
                    id="name"
                    v-model="name"
                    type="text"
                    class="form-control form-control-lg"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    class="form-control form-control-lg"
                    required
                  />
                </div>

                <div class="mb-4">
                  <label class="form-label">Role</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    :value="authStore.user?.role || 'user'"
                    disabled
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100 btn-lg mb-3"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ loading ? 'Updating...' : 'Update Profile' }}
                </button>

                <button
                  type="button"
                  class="btn btn-outline-danger w-100"
                  @click="logout"
                >
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.profile-avatar {
  font-size: 5rem;
  color: #667eea;
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
}
</style>
