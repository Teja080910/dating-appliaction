import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIURL, USE_MOCK } from '../environment/ApiConfig';
import { clearAuthSession, getAuthToken } from '../utils/sessionState';
import { handleMockRequest } from '../mock/mockAdapter';

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

/**
 * React Native stores the native IOException text in the XHR, but `response`
 * returns '' once the request has failed (`_hasError`). `responseText` still
 * exposes it, so read that first.
 */
export const getNativeNetworkError = (error: any): string | null => {
  const request = error?.request;
  if (!request) return null;

  try {
    const text = request.responseText;
    if (typeof text === 'string' && text.trim()) return text.trim();
  } catch {}

  try {
    const response = request.response;
    if (typeof response === 'string' && response.trim()) return response.trim();
  } catch {}

  return null;
};

const summarizeApiError = (error: any) => {
  const respData = error?.response?.data;
  let detailsText: string | null = null;
  if (typeof respData === 'string') {
    detailsText = respData;
  } else if (respData && typeof respData === 'object') {
    detailsText = respData.message || respData.error || respData.details || JSON.stringify(respData);
  }

  const nativeReason = !error?.response ? getNativeNetworkError(error) : '';

  return {
    status: Number(error?.response?.status || 0) || null,
    url: String(error?.config?.url || '').trim() || null,
    message: String(error?.message || 'Unknown API error'),
    details: detailsText,
    data: respData,
    ...(nativeReason ? { native: nativeReason } : {}),
  };
};

const defaultAxiosAdapter = axios.getAdapter(axios.defaults.adapter);

const hybridAdapter = async (config: any) => {
  if (USE_MOCK || process.env.NODE_ENV === 'test') {
    return handleMockRequest(config);
  }

  const url = String(config.url || '');
  const isDataEndpoint =
    url.includes('/notification') ||
    url.includes('/emails/my');

  if (defaultAxiosAdapter) {
    try {
      const response = await defaultAxiosAdapter(config);
      if (response && response.status >= 200 && response.status < 300) {
        if (isDataEndpoint) {
          const data = response.data;
          const items = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.notifications)
            ? data.notifications
            : null;

          if (items && items.length > 0) {
            return response; // Show backend data
          }

          // Backend returned empty list; fallback to local mock store
          const mockRes = await handleMockRequest(config);
          const mockItems = Array.isArray(mockRes.data)
            ? mockRes.data
            : Array.isArray(mockRes.data?.data)
            ? mockRes.data.data
            : Array.isArray(mockRes.data?.content)
            ? mockRes.data.content
            : [];
          if (mockItems.length > 0) {
            return mockRes;
          }
        }
        return response;
      }
    } catch (backendError: any) {
      const status = Number(backendError?.response?.status || 0);
      const method = String(config?.method || 'get').toLowerCase();

      // Re-throw 401 session expiration so auth handler can redirect to login
      if (status === 401) {
        throw backendError;
      }

      // Writes must never be faked. A network-level failure (status 0: timeout,
      // connection drop, unreachable host) previously fell through to the mock
      // adapter, which answered 200 with a fake image and swallowed the error.
      if (method !== 'get') {
        // Native IOException text for below-HTTP failures ("cleartext not
        // permitted", "unexpected end of stream", "Could not open file"...).
        const nativeReason = getNativeNetworkError(backendError);
        // A 4xx write rejection is an expected business answer (photo rejected,
        // photo limit, ownership...). It is surfaced to the user through an
        // alert, so it must not raise a LogBox error in development.
        const logRejectedWrite =
          status >= 400 && status < 500 ? console.log : console.error;
        logRejectedWrite(
          `[ApiClient] ${method.toUpperCase()} ${url} failed (status ${status || 'network'}):`,
          backendError?.message,
          nativeReason ? `| native: ${nativeReason}` : '',
        );
        throw backendError;
      }

      // Gallery data must come from the server. Serving mock images here makes
      // the photo grid look populated while nothing is actually stored.
      if (url.includes('/images') || url.includes('/upload-image')) {
        console.error('[ApiClient] Image request failed, not falling back to mock:', url, backendError?.message);
        throw backendError;
      }

      if (status === 400 || status === 403 || status === 409 || status === 422) {
        throw backendError;
      }

      console.warn('[ApiClient] Backend request failed, falling back to mock data:', url, backendError?.message);
      return handleMockRequest(config);
    }
  }

  return handleMockRequest(config);
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: '*/*',
  },
  adapter: hybridAdapter,
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

      const isFormData =
        config.data instanceof FormData ||
        (config.data && typeof config.data === 'object' && Array.isArray((config.data as any)._parts));

      if (isFormData) {
        // axios runs dispatchRequest AFTER this interceptor and does
        //   headers.setContentType('application/x-www-form-urlencoded', false)
        // for every POST/PUT/PATCH. Deleting the header here therefore does
        // nothing — axios re-adds the urlencoded type and React Native refuses
        // to send a multipart body with it, failing with the native error
        // "multipart != application/x-www-form-urlencoded".
        // Setting it explicitly wins, because axios only fills it in when absent.
        // The boundary is appended by the native multipart builder.
        if (typeof (config.headers as any)?.set === 'function') {
          (config.headers as any).set('Content-Type', 'multipart/form-data');
        } else if (config.headers) {
          (config.headers as any)['Content-Type'] = 'multipart/form-data';
        }
      } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      if (__DEV__) {
        console.log(`➡️ [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.params ? { params: config.params } : '');
      }

      return config;
    } catch (err) {
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// ✅ DEDUPLICATE in-flight GET requests (prevents infinite loops while preserving distinct query params)
const originalGet = apiClient.get;
apiClient.get = async function(url: string, config?: any) {
  const paramsKey = config?.params ? JSON.stringify(config.params) : '';
  const key = `GET:${url}:${paramsKey}`;
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

    console.log(`[API DEBUG] Request to ${url} failed: ${summary.details || summary.message}`);
    console.log('❌ API ERROR:', JSON.stringify(summary));

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
  const lower = normalizedUrl.toLowerCase();
  if (lower.includes('success') || lower.includes('failed') || lower.includes('error') || lower.includes('done') || normalizedUrl.includes(' ')) {
    return 'https://via.placeholder.com/150';
  }
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
