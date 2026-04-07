import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIURL } from '../environment/ApiConfig';
import { clearAuthSession, getAuthToken, isResolvedApiUserId } from '../utils/sessionState';

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

// ✅ RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const summary = summarizeApiError(error);
    const errorMessage = String(summary.details || '').toLowerCase();

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

export const toApiUserId = (value: unknown): number => {
  const strVal = String(value || '').trim();

  if (isResolvedApiUserId(strVal)) {
    return Number(strVal);
  }

  throw new Error(`Invalid or unresolved userId: ${strVal}`);
};

export default apiClient;
