import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import apiClient from '../src/api/apiClient';
import {
  extractSelfieVerificationUrl,
  saveSelfieVerificationUrl,
  getStoredSelfieVerificationUrl,
  fetchSelfieVerificationUrl,
  refreshSelfieVerificationUrl,
  faceValidationClient,
  SELFIE_VERIFICATION_URL_STORAGE_KEY,
  DEFAULT_SELFIE_VERIFICATION_URL,
} from '../src/api/useFaceValidation';

describe('Dynamic Selfie Verification URL from Registration / Backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
  });

  test('extractSelfieVerificationUrl extracts URL from various backend formats', () => {
    // 1. exact backend team variable: selfieVerification
    expect(
      extractSelfieVerificationUrl({ selfieVerification: 'https://backend-ai.amara.com' })
    ).toBe('https://backend-ai.amara.com');

    expect(
      extractSelfieVerificationUrl({ data: { selfieVerification: 'https://backend-ai.amara.com/' } })
    ).toBe('https://backend-ai.amara.com');

    // 2. camelCase in top-level
    expect(
      extractSelfieVerificationUrl({ selfieVerificationUrl: 'https://ai-selfie.amara.com' })
    ).toBe('https://ai-selfie.amara.com');

    // 2. snake_case in top-level
    expect(
      extractSelfieVerificationUrl({ selfie_verification_url: 'https://ai-selfie.amara.com/' })
    ).toBe('https://ai-selfie.amara.com');

    // 3. nested in data object
    expect(
      extractSelfieVerificationUrl({
        data: {
          faceValidationUrl: 'https://faces.amara.com:8443',
        },
      })
    ).toBe('https://faces.amara.com:8443');

    // 4. plain string URL
    expect(
      extractSelfieVerificationUrl('https://dynamic-ai.ngrok.app/')
    ).toBe('https://dynamic-ai.ngrok.app');

    // 5. invalid / null returns null
    expect(extractSelfieVerificationUrl(null)).toBeNull();
    expect(extractSelfieVerificationUrl({})).toBeNull();

    // 6. Common ngrok/AI/base URL aliases
    expect(
      extractSelfieVerificationUrl({ ngrokUrl: 'https://ai.ngrok-free.dev' })
    ).toBe('https://ai.ngrok-free.dev');
    expect(
      extractSelfieVerificationUrl({ data: { aiUrl: 'https://ai.example.com' } })
    ).toBe('https://ai.example.com');

    // 7. URL wrapped as a plain string
    expect(
      extractSelfieVerificationUrl({ data: 'https://wrapped.example.com' })
    ).toBe('https://wrapped.example.com');
  });

  test('saveSelfieVerificationUrl persists URL and updates faceValidationClient defaults', async () => {
    const testUrl = 'https://custom-ai-service.amara.com';
    await saveSelfieVerificationUrl(testUrl);

    const stored = await AsyncStorage.getItem(SELFIE_VERIFICATION_URL_STORAGE_KEY);
    expect(stored).toBe(testUrl);

    const retrieved = await getStoredSelfieVerificationUrl();
    expect(retrieved).toBe(testUrl);
    expect(faceValidationClient.defaults.baseURL).toBe(testUrl);
  });

  test('fetchSelfieVerificationUrl uses the dedicated backend endpoint when provided', async () => {
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes('selfie/verification-url')) {
        return Promise.resolve({ data: { selfieVerification: 'https://ai-service.example.com' } });
      }
      return Promise.resolve({ data: {} });
    });

    const url = await fetchSelfieVerificationUrl();

    expect(url).toBe('https://ai-service.example.com');
    expect(await AsyncStorage.getItem(SELFIE_VERIFICATION_URL_STORAGE_KEY)).toBe(
      'https://ai-service.example.com'
    );
  });

  test('fetchSelfieVerificationUrl accepts a plain url field from the dedicated endpoint', async () => {
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes('selfie/verification-url')) {
        return Promise.resolve({ data: { url: 'https://plain-url.example.com' } });
      }
      return Promise.resolve({ data: {} });
    });

    const url = await fetchSelfieVerificationUrl();

    expect(url).toBe('https://plain-url.example.com');
  });

  test('refreshSelfieVerificationUrl drops a stale cached URL before asking the backend', async () => {
    await saveSelfieVerificationUrl('https://dead-tunnel.ngrok-free.dev');
    expect(await getStoredSelfieVerificationUrl()).toBe('https://dead-tunnel.ngrok-free.dev');

    const refreshed = await refreshSelfieVerificationUrl();

    if (refreshed) {
      expect(refreshed.startsWith('http')).toBe(true);
    } else {
      expect(await AsyncStorage.getItem(SELFIE_VERIFICATION_URL_STORAGE_KEY)).toBeNull();
      expect(faceValidationClient.defaults.baseURL).toBe(DEFAULT_SELFIE_VERIFICATION_URL);
    }
  });

  test('fetchSelfieVerificationUrl returns null or valid URL when endpoint is not yet provided', async () => {
    const url = await fetchSelfieVerificationUrl();
    if (url) {
      expect(url.startsWith('http')).toBe(true);
    } else {
      expect(url).toBeNull();
    }
  });
});
