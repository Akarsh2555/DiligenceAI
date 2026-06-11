import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
