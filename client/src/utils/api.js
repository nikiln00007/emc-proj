import axios from 'axios';
import { auth } from './firebase';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // If deployed as monolith on same host, use relative path; in dev default to port 5000
  return import.meta.env.PROD ? '' : 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID token or active session token to every request
api.interceptors.request.use(async (config) => {
  try {
    let token = null;

    // 1. Check real Firebase Auth user
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      try {
        token = await user.getIdToken();
      } catch (e) {
        console.warn('Firebase token retrieval note:', e.message);
      }
    }

    // 2. Fallback to active dev/mock session token if Firebase client is unauthenticated
    if (!token && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('peerhub_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.uid) {
            token = `dev-token:${btoa(JSON.stringify({
              uid: parsed.uid,
              email: parsed.email || '',
              role: parsed.role || 'student',
              name: parsed.displayName || parsed.name || 'User',
            }))}`;
          }
        }
      } catch (e) {}
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Error configuring auth header:', err.message);
  }
  return config;
});

// Normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
