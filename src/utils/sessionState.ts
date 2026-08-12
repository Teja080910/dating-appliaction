import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './types/AsyncStorage';

export const USER_VERIFIED_KEY = 'user_identity_verified';

export const STORAGE_KEYS = {
  acceptedTerms: 'acceptedTerms',
  entryHomeScreen: 'entryHomeScreen',
  firstImageUploaded: 'firstImageUploaded',
  isLoggedIn: 'isLoggedIn',
  isSubscribed: 'isSubscribed',
  onboardingStep: 'onboardingStep',
  selectedGender: 'selectedGender',
  token: 'token',
  user: 'user',
  userData: 'user_data',
  userId: 'userId',
} as const;

const ONBOARDING_SCOPED_KEYS = {
  acceptedTerms: 'acceptedTermsBySubject',
  onboardingComplete: 'onboardingCompleteBySubject',
} as const;

const normalizeStoredString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return normalized;
};

const decodeJwtPayload = (token: string | null | undefined) => {
  const normalizedToken = normalizeStoredString(token);
  if (!normalizedToken) {
    return null;
  }

  try {
    const [, payloadSegment] = normalizedToken.split('.');
    if (!payloadSegment) {
      return null;
    }

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const atobFn = (globalThis as any).atob;
    const bufferCtor = (globalThis as any).Buffer;
    const decoded =
      typeof atobFn === 'function'
        ? atobFn(padded)
        : bufferCtor?.from
          ? bufferCtor.from(padded, 'base64').toString('utf-8')
          : null;

    return decoded ? JSON.parse(decoded) : null;
  } catch (error) {
    return null;
  }
};

export const resolveStoredSessionSubject = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    const payload = decodeJwtPayload(token);
    return normalizeStoredString(payload?.sub || payload?.subject || null);
  } catch (error) {
    return null;
  }
};

const getScopedStorageKey = (baseKey: string, subject: string) => `${baseKey}:${subject}`;

const setScopedFlagForCurrentSubject = async (baseKey: string, value: string) => {
  const subject = await resolveStoredSessionSubject();
  if (!subject) {
    return;
  }

  await AsyncStorage.setItem(getScopedStorageKey(baseKey, subject), value);
};

export const restoreScopedOnboardingState = async (token: string | null | undefined) => {
  const payload = decodeJwtPayload(token);
  const subject = normalizeStoredString(payload?.sub || payload?.subject || null);

  if (!subject) {
    return {
      acceptedTerms: false,
      onboardingComplete: false,
    };
  }

  const [acceptedTermsValue, onboardingCompleteValue] = await AsyncStorage.multiGet([
    getScopedStorageKey(ONBOARDING_SCOPED_KEYS.acceptedTerms, subject),
    getScopedStorageKey(ONBOARDING_SCOPED_KEYS.onboardingComplete, subject),
  ]);

  return {
    acceptedTerms: acceptedTermsValue?.[1] === 'true',
    onboardingComplete: onboardingCompleteValue?.[1] === 'true',
  };
};

export const isLikelyFallbackSubjectId = (value: unknown): boolean => {
  const normalized = String(value || '').trim();
  const digits = normalized.replace(/\D/g, '');
  
  if (!digits || digits.length < 10 || digits.length > 14) {
    return false;
  }

  const startsWithMobilePrefix = /^[6-9]/.test(digits);
  const startsWithCountryCode = digits.startsWith('91') && digits.length >= 12;

  return startsWithMobilePrefix || startsWithCountryCode;
};

// In-memory cache to avoid async calls in synchronous isResolvedApiUserId
let _identityVerifiedCache = false;
let _verifiedUserIdCache: string | null = null;

export const setVerifiedIdentityCache = (userId: string) => {
  _identityVerifiedCache = true;
  _verifiedUserIdCache = userId;
};

export const initVerifiedIdentityCache = async () => {
  try {
    const [verified, storedId] = await AsyncStorage.multiGet([USER_VERIFIED_KEY, STORAGE_KEYS.userId]);
    if (verified?.[1] === 'true' && storedId?.[1]) {
      _identityVerifiedCache = true;
      _verifiedUserIdCache = storedId[1];
    }
  } catch (e) {}
};

export const isResolvedApiUserId = (value: unknown): boolean => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === '0' || normalized === 'null' || normalized === 'undefined') {
    return false;
  }

  // Backend userIds are alphanumeric strings (e.g. SA1000). Accept them as-is.
  if (/^[A-Za-z]+\d+$/.test(normalized)) {
    return true;
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return false;
  }

  // If it looks like a mobile number, only accept if identity has been verified
  if (isLikelyFallbackSubjectId(normalized)) {
    return _identityVerifiedCache && _verifiedUserIdCache === normalized;
  }

  return true;
};

export const normalizeTextValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return normalized;
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.userId,
    STORAGE_KEYS.isLoggedIn,
    STORAGE_KEYS.user,
    STORAGE_KEYS.userData,
    USER_VERIFIED_KEY,
    'userToken',
    'userMobile',
  ]);

  try {
    await AsyncStorageService.clearUser();
  } catch (e) {}
};

export const clearOnboardingState = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.acceptedTerms,
    STORAGE_KEYS.entryHomeScreen,
    STORAGE_KEYS.onboardingStep,
    STORAGE_KEYS.selectedGender,
  ]);
};

export const clearFullSession = async () => {
  await clearAuthSession();
  await clearOnboardingState();
};

export const markTermsAccepted = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.acceptedTerms, 'true');
  await setScopedFlagForCurrentSubject(ONBOARDING_SCOPED_KEYS.acceptedTerms, 'true');
  const currentStep = await AsyncStorage.getItem(STORAGE_KEYS.onboardingStep);
  if (currentStep === 'Privacy') {
    await AsyncStorage.removeItem(STORAGE_KEYS.onboardingStep);
  }
};

export const completeOnboarding = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.entryHomeScreen, 'true');
  await setScopedFlagForCurrentSubject(ONBOARDING_SCOPED_KEYS.onboardingComplete, 'true');
  await AsyncStorage.removeItem(STORAGE_KEYS.onboardingStep);
};

export const markIdentityVerified = async (userId: string) => {
    if (!userId) return;
    try {
        await AsyncStorage.setItem(USER_VERIFIED_KEY, 'true');
        setVerifiedIdentityCache(userId);
        if (__DEV__) console.log('[session] Identity marked as VERIFIED for ID:', userId);
    } catch (e) {}
};

/**
 * Robustly retrieve the auth token from multiple storage sources.
 * Breaking circular dependency by moving this here!
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    if (token && token !== '' && token !== 'null') return token;
  } catch (e) {}

  try {
    const legacyToken = await AsyncStorage.getItem('userToken');
    if (legacyToken && legacyToken !== '' && legacyToken !== 'null') return legacyToken;
  } catch (e) {}

  try {
    const user = await AsyncStorageService.getUser();
    const token = user?.token || user?.data?.token || user?.accessToken || user?.jwt || user?.data?.accessToken || user?.data?.jwt;
    if (token) return token;
  } catch (e) {}

  try {
    const backup = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    if (backup) {
      const parsed = JSON.parse(backup);
      const token = parsed?.token || parsed?.data?.token || parsed?.accessToken || parsed?.jwt || parsed?.data?.accessToken || parsed?.data?.jwt;
      if (token) return token;
    }
  } catch (e) {}

  return null;
};
