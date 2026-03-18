import { defineStore } from 'pinia';
import { authAPI, userAPI } from '@/api/index.js';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        userData: (state) => state.user,
        isAdmin: (state) => state.user?.role === 'admin',
        isDemo: (state) => state.user?.isDemo === true
    },

    actions: {
        async login(credentials) {
            this.loading = true;
            this.error = null;

            try {
                const response = await authAPI.login(credentials);
                const { token, user } = response.data;

                this.token = token;
                this.user = user;

                // Store in localStorage for persistence
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Store remember me preference
                if (credentials.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }

                return { success: true };
            } catch (error) {
                const message = error.response?.data?.message || 'Login failed. Please try again.';
                this.error = message;
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async register(userData) {
            this.loading = true;
            this.error = null;

            try {
                const response = await authAPI.register(userData);
                const { token, user } = response.data;

                this.token = token;
                this.user = user;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                return { success: true };
            } catch (error) {
                const message = error.response?.data?.message || 'Registration failed. Please try again.';
                this.error = message;
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async fetchUser() {
            if (!this.token) return;

            try {
                const response = await userAPI.getProfile();
                this.user = response.data.user;
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } catch (error) {
                console.error('Failed to fetch user:', error);
                // If 401, logout
                if (error.response?.status === 401) {
                    this.logout();
                }
            }
        },

        async updateProfile(userData) {
            this.loading = true;
            this.error = null;

            try {
                const response = await userAPI.updateProfile(userData);
                this.user = response.data.user;
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return { success: true, user: response.data.user };
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to update profile.';
                this.error = message;
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            this.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },

        clearError() {
            this.error = null;
        }
    }
});
