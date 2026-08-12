import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIURL } from '../environment/ApiConfig';
import { clearAuthSession, getAuthToken } from '../utils/sessionState';

const BASE_URL = APIURL;

export const SESSION_EXPIRED_EVENT = 'SESSION_EXPIRED';

const PUBLIC_AUTH_PATHS = [
  '/login',
  '/register',
  '/verify-register/otp',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/forgot-password/send-otp',
  '/forgot-password/reset',
];

const isPublicAuthRequest = (url: string | null | undefined) => {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  return PUBLIC_AUTH_PATHS.some((path) => normalizedUrl.includes(path));
};

const summarizeApiError = (error: any) => ({
  status: Number(error?.response?.status || 0) || null,
  url: String(error?.config?.url || '').trim() || null,
  message: String(error?.message || 'Unknown API error'),
  details:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    null,
});

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: '*/*',
  },
});

const pendingRequests = new Map<string, Promise<any>>();

// Retry config for stale connections (app background → foreground)
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const shouldRetry = (error: any) => {
  // Network error with no response (stale connection after app switch)
  return !error.response && error.message === 'Network Error' && error.config && !error.config._retryCount;
};

// ✅ REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = (await getAuthToken()) || (await AsyncStorage.getItem('userToken'));
      const skipAuth = isPublicAuthRequest(config.url);

      config.withCredentials = true;

      if (token && !skipAuth) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }

      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        config.headers['Content-Type'] = 'application/json';
      }

      if (__DEV__) {
        console.log(`➡️ [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (err) {
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// ✅ DEDUPLICATE in-flight GET requests (prevents infinite loops)
const originalGet = apiClient.get;
apiClient.get = async function(url: string, config?: any) {
  const key = `GET:${url}`;
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  const promise = originalGet.call(this, url, config).finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
};

// ✅ RESPONSE INTERCEPTOR with retry for stale connections
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const summary = summarizeApiError(error);
    const errorMessage = String(summary.details || '').toLowerCase();

    // Retry on network errors (stale connection after app switch)
    if (shouldRetry(error)) {
      error.config._retryCount = (error.config._retryCount || 0) + 1;
      if (error.config._retryCount <= MAX_RETRIES) {
        console.log(`[API RETRY] Attempt ${error.config._retryCount}/${MAX_RETRIES} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return apiClient.request(error.config);
      }
    }

    console.log(`[API DEBUG] Request to ${url} failed: ${summary.message}`);
    console.log('❌ API ERROR:', summary);

    if (status === 401 && !isPublicAuthRequest(url)) {
      const isIdentityMismatch =
          errorMessage.includes('user not found') ||
          errorMessage.includes('invalid userid') ||
          url.includes('/profile/me') ||
          url.includes('/profile/completion');

      if (!isIdentityMismatch) {
        console.warn('⚠️ Session Expired (Auth Error)');
        await clearAuthSession();
        DeviceEventEmitter.emit(SESSION_EXPIRED_EVENT);
      }
    }

    return Promise.reject(error);
  }
);

export const getAbsoluteUrl = (url: string | null | undefined) => {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  if (!normalizedUrl) return 'https://via.placeholder.com/150';
  if (/^(https?:\/\/|file:\/\/|content:\/\/|asset:\/\/|ph:\/\/|data:)/i.test(normalizedUrl)) return normalizedUrl;
  return `${BASE_URL}${normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`}`;
};

export const isApiHostedUrl = (url: string | null | undefined) => {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  return Boolean(normalizedUrl && normalizedUrl.startsWith(BASE_URL));
};

export const toApiUserId = (value: unknown): string => {
  const strVal = String(value || '').trim();

  if (!strVal) {
    throw new Error('UserId is empty');
  }

  // Backend userIds are alphanumeric strings (e.g. SA1000) — pass through as-is
  return strVal;
};

export default apiClient;
