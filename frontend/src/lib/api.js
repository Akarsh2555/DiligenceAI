import axios from 'axios';
import { supabase } from './supabase';

// Single source of truth for the backend base URL.
// - In dev: leave VITE_API_URL unset → '/api' (Vite proxy forwards to :8000).
// - In prod: set VITE_API_URL to the deployed backend, e.g.
//     https://your-backend.onrender.com/api
// Used by axios AND by the raw fetch()/iframe paths so nothing hits the
// frontend host or localhost in production.
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return api(originalRequest);
          }
        }
      } catch (e) {
        // Refresh failed, let the error fall through
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// SSE helper with auth
export function createAuthSSE(url) {
  return new Promise(async (resolve) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}token=${token}`;
    resolve(new EventSource(fullUrl));
  });
}
