import axios, { type AxiosError } from 'axios';
import '@/lib/api/axios-extensions';
import { getApiBaseUrl } from '@/config/env';
import { readStoredAccessToken, writeStoredAccessToken } from '@/lib/auth/access-token-storage';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiEnvelope } from '@/types/api';

let refreshPromise: Promise<string> | null = null;

/** Uses httpOnly refresh cookie; updates in-memory + sessionStorage access token. */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const bare = axios.create({
        baseURL: getApiBaseUrl(),
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      const { data } = await bare.post<ApiEnvelope<{ tokens: { accessToken: string; expiresIn: number } }>>(
        '/auth/refresh',
        {},
        { _skipAuthRefresh: true },
      );
      if (!data.success || !data.data?.tokens?.accessToken) {
        throw new Error(data.message || 'Refresh failed');
      }
      const accessToken = data.data.tokens.accessToken;
      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Restore access token after reload (cookie refresh) when none is in memory. */
export async function ensureAccessToken(): Promise<string | null> {
  const existing = useAuthStore.getState().accessToken ?? readStoredAccessToken();
  if (existing) {
    if (!useAuthStore.getState().accessToken) {
      useAuthStore.getState().setAccessToken(existing);
    }
    return existing;
  }
  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Multipart uploads must not use application/json — axios must set boundary automatically. */
function stripJsonContentTypeForFormData(config: import('axios').InternalAxiosRequestConfig) {
  if (typeof FormData === 'undefined' || !(config.data instanceof FormData)) return;
  const headers = config.headers;
  if (!headers) return;
  if (typeof headers.delete === 'function') {
    headers.delete('Content-Type');
    headers.delete('content-type');
  } else if (typeof headers === 'object') {
    delete (headers as Record<string, unknown>)['Content-Type'];
    delete (headers as Record<string, unknown>)['content-type'];
  }
}

api.interceptors.request.use(async (config) => {
  stripJsonContentTypeForFormData(config);
  let token = useAuthStore.getState().accessToken ?? readStoredAccessToken();
  if (!token && !config._skipAuthRefresh) {
    token = await ensureAccessToken();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config;
    if (!orig || orig._retry || orig._skipAuthRefresh) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (typeof orig.url === 'string' && orig.url.includes('/auth/change-password')) {
      return Promise.reject(error);
    }
    if (typeof orig.url === 'string' && orig.url.includes('/auth/refresh')) {
      useAuthStore.getState().clearSession();
      writeStoredAccessToken(null);
      return Promise.reject(error);
    }
    orig._retry = true;
    try {
      const access = await refreshAccessToken();
      orig.headers.Authorization = `Bearer ${access}`;
      return api.request(orig);
    } catch {
      useAuthStore.getState().clearSession();
      writeStoredAccessToken(null);
      return Promise.reject(error);
    }
  },
);
