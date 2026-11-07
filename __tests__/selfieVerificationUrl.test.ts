import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  extractSelfieVerificationUrl,
  saveSelfieVerificationUrl,
  getStoredSelfieVerificationUrl,
  fetchSelfieVerificationUrl,
  faceValidationClient,
  SELFIE_VERIFICATION_URL_STORAGE_KEY,
  DEFAULT_SELFIE_VERIFICATION_URL,
} from '../src/api/useFaceValidation';

describe('Dynamic Selfie Verification URL from Registration / Backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
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

  test('fetchSelfieVerificationUrl falls back gracefully when endpoint is not yet provided', async () => {
    const url = await fetchSelfieVerificationUrl();
    expect(url).toBeTruthy();
    expect(url.startsWith('http')).toBe(true);
  });
});
