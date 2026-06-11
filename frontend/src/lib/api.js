import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api',
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
    if (error.response?.status === 401) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        const { data: { session } } = await supabase.auth.getSession();
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return api.request(error.config);
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
