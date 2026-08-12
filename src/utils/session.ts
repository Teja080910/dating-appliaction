import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './types/AsyncStorage';
import { APIURL } from '../environment/ApiConfig';
import { decode as atob } from 'base-64';

// ✅ Break circular dependency: Export core state functions from independent source
export * from './sessionState';

import { 
  markIdentityVerified,
  STORAGE_KEYS,
  USER_VERIFIED_KEY,
  isResolvedApiUserId,
  isLikelyFallbackSubjectId,
  restoreScopedOnboardingState,
  initVerifiedIdentityCache,
  setVerifiedIdentityCache,
} from './sessionState';

export const SESSION_TOKEN_KEY = 'auth_token';
export const USER_ID_KEY = 'user_id';
const IDENTITY_REPAIR_CACHE = new Map<string, string | null>();
const IDENTITY_REPAIR_IN_FLIGHT = new Map<string, Promise<string | null>>();
const PROFILE_ID_SCAN_LIMIT = 200;

const ONBOARDING_ROUTES = new Set([
  'Privacy',
  'GenderOrientation',
  'DisplayName',
  'DOB',
  'UploadImage',
  'SelfieVerification',
  'MoreDetails',
  'AboutProfile',
  'ConnectTelegram',
]);

const normalizeStoredString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }

  return normalized;
};

const normalizeDigitsOnly = (value: unknown): string | null => {
  const normalized = normalizeStoredString(value);
  if (!normalized) {
    return null;
  }

  const digitsOnly = normalized.replace(/\D/g, '');
  return digitsOnly || null;
};

const normalizeApiUserIdCandidate = (value: unknown): string | null => {
  const normalized = normalizeStoredString(value);
  if (!normalized) {
    return null;
  }

  // Backend userIds are alphanumeric strings (e.g. SA1000)
  if (/^[A-Za-z]+\d+$/.test(normalized)) {
    return normalized;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const numericId = Number(normalized);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  return normalized;
};

const isMobileSubjectCandidate = (value: unknown): boolean => {
  const digitsOnly = normalizeDigitsOnly(value);
  return Boolean(digitsOnly && digitsOnly.length >= 10);
};

const describeError = (error: any) => ({
  message: String(error?.message || 'Unknown error'),
  status: Number(error?.response?.status || 0) || null,
  details:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    null,
});

// Helping functions isResolvedApiUserId etc. now imported from sessionState.ts

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
    console.warn('[session] Failed to decode JWT payload:', describeError(error));
    return null;
  }
};

const resolveTokenSubject = (token: string | null | undefined): string | null => {
  const payload = decodeJwtPayload(token);
  return normalizeStoredString(payload?.sub || payload?.subject || null);
};

export const resolveUserIdFromToken = (token: string | null | undefined): string | null => {
  void token;
  return null;
};

const extractIdentityCandidate = (payload: any): string | null => {
  const candidate =
    payload?.user?.id ||
    payload?.data?.user?.id ||
    payload?.id ||
    payload?.data?.id ||
    payload?.userId ||
    payload?.data?.userId ||
    null;

  return normalizeApiUserIdCandidate(candidate);
};

const persistResolvedUserId = async (userId: string) => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.userId, userId],
    ['userId', userId],
  ]);
  await AsyncStorage.removeItem('userMobile');
  await markIdentityVerified(userId);
};

const probeProfileById = async (userId: number, token: string) => {
  const requestConfig = {
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(`${APIURL}/profile/me`, null, { ...requestConfig, params: { userId } });
  return response?.data;
};

const repairIdentity = async (subject: string, token: string) => {
  if (!isMobileSubjectCandidate(subject)) {
    return null;
  }

  try {
    for (let candidateId = 1; candidateId <= PROFILE_ID_SCAN_LIMIT; candidateId += 1) {
      try {
        const profilePayload = await probeProfileById(candidateId, token);
        const resolvedUserId = extractIdentityCandidate(profilePayload) || String(candidateId);

        if (resolvedUserId && isResolvedApiUserId(resolvedUserId)) {
          await persistResolvedUserId(resolvedUserId);
          if (__DEV__) {
            console.log('[session] Repaired numeric userId from /profile/me/{id}:', resolvedUserId);
          }
          return resolvedUserId;
        }
      } catch (error: any) {
        const status = Number(error?.response?.status || 0);
        if (status !== 400 && status !== 403 && __DEV__) {
          console.warn(`[session] Identity probe failed for candidate ${candidateId}:`, describeError(error));
        }
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[session] Failed to repair identity from backend profile scan:', describeError(error));
    }
  }

  return null;
};

export const resolveIdentity = async (sessionData: any) => {
  try {
    const token = normalizeStoredString(sessionData?.token);
    const subject =
      normalizeStoredString(sessionData?.subject) ||
      resolveTokenSubject(token) ||
      normalizeStoredString(sessionData?.user?.mobile) ||
      normalizeStoredString(sessionData?.raw?.mobile) ||
      null;

    const currentUserId = normalizeApiUserIdCandidate(sessionData?.userId);
    if (currentUserId && isResolvedApiUserId(currentUserId)) {
      return {
        ...sessionData,
        userId: currentUserId,
        subject,
        isGuest: !subject,
      };
    }

    if (!token) {
      return {
        ...sessionData,
        userId: null,
        subject,
        isGuest: !subject,
      };
    }

    if (subject && isMobileSubjectCandidate(subject)) {
      if (__DEV__) {
        console.log('[session] Subject is mobile, keeping identity pending until a numeric userId is available.');
      }

      const repairedUserId = await repairIdentity(subject, token);
      if (repairedUserId) {
        return {
          ...sessionData,
          userId: repairedUserId,
          subject,
          isGuest: false,
          __isVerified: true,
        };
      }

      return {
        ...sessionData,
        userId: null,
        subject,
        isGuest: false,
      };
    }

    return {
      ...sessionData,
      userId: null,
      subject,
      isGuest: !subject,
    };
  } catch (error) {
    console.error('[session] Critical failure in resolveIdentity:', describeError(error));
    return null;
  }
};

const resolveSessionIdentityFromApi = async (session: {
  token: string | null;
  userId: string | null;
  user: any;
  raw: any;
}) => {
  const resolvedIdentity = await resolveIdentity(session);
  return resolvedIdentity || {
    ...session,
    userId: null,
  };
};

export const repairStoredSessionIdentity = async () => {
  const [tokenEntry, userIdEntry, rawEntry, userEntry, verifiedEntry] = await AsyncStorage.multiGet([
    STORAGE_KEYS.token,
    STORAGE_KEYS.userId,
    STORAGE_KEYS.userData,
    STORAGE_KEYS.user,
    USER_VERIFIED_KEY,
  ]);

  const token = normalizeStoredString(tokenEntry?.[1]);
  const storedUserId = normalizeStoredString(userIdEntry?.[1]);
  const isPreviouslyVerified = verifiedEntry?.[1] === 'true';

  if (!token) {
    return isResolvedApiUserId(storedUserId) ? storedUserId : null;
  }

  const cacheKey = `${token}:${storedUserId || 'missing'}`;
  if (IDENTITY_REPAIR_CACHE.has(cacheKey)) {
    return IDENTITY_REPAIR_CACHE.get(cacheKey) ?? null;
  }

  const existingRepair = IDENTITY_REPAIR_IN_FLIGHT.get(cacheKey);
  if (existingRepair) {
    return existingRepair;
  }

  if (isPreviouslyVerified || (storedUserId && !isLikelyFallbackSubjectId(storedUserId))) {
    return storedUserId;
  }

  let raw = null;
  let user = null;

  try {
    raw = rawEntry?.[1] ? JSON.parse(rawEntry[1]) : null;
  } catch (error) {
    console.warn('[session] Failed to parse stored user_data during repair:', describeError(error));
  }

  try {
    user = userEntry?.[1] ? JSON.parse(userEntry[1]) : null;
  } catch (error) {
    console.warn('[session] Failed to parse stored user during repair:', describeError(error));
  }

  const repairPromise = (async () => {
    const repairedSession = await resolveSessionIdentityFromApi({
      token,
      userId: storedUserId,
      user: user || raw?.user || null,
      raw: raw || {},
    });

    const resolvedUserId = normalizeApiUserIdCandidate(repairedSession.userId);
    if (!resolvedUserId || !isResolvedApiUserId(resolvedUserId)) {
      IDENTITY_REPAIR_CACHE.set(cacheKey, null);
      return null;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.userId, resolvedUserId);
    await markIdentityVerified(resolvedUserId);
    IDENTITY_REPAIR_CACHE.set(cacheKey, resolvedUserId);

    return resolvedUserId;
  })();

  IDENTITY_REPAIR_IN_FLIGHT.set(cacheKey, repairPromise);

  try {
    return await repairPromise;
  } finally {
    IDENTITY_REPAIR_IN_FLIGHT.delete(cacheKey);
  }
};

export const getAuthSession = async () => {
    const [tokenVal, userIdVal, userVal, rawVal, verifiedVal] = await AsyncStorage.multiGet([
        STORAGE_KEYS.token,
        STORAGE_KEYS.userId,
        STORAGE_KEYS.user,
        STORAGE_KEYS.userData,
        USER_VERIFIED_KEY,
    ]);

    const token = normalizeStoredString(tokenVal?.[1]);
    const userId = normalizeStoredString(userIdVal?.[1]);
    const isVerified = verifiedVal?.[1] === 'true';

    let user = null;
    let raw = null;

    try {
        if (userVal?.[1]) user = JSON.parse(userVal[1]);
        if (rawVal?.[1]) raw = JSON.parse(rawVal[1]);
    } catch (e) {
    }

    return {
        token,
        userId: userId || null,
        user,
        raw,
        __isVerified: isVerified || isResolvedApiUserId(userId),
    };
};

const resolveStoredGenderSelection = (profile: any): string | null => {
  const gender = String(profile?.gender || '').toLowerCase();
  const orientation = String(profile?.orientation || '').toLowerCase();

  if (gender === 'woman' && orientation === 'straight') {
    return 'straight_woman';
  }

  if (gender === 'man' && orientation === 'straight') {
    return 'straight_man';
  }

  if (gender || orientation) {
    return 'lgbtqia';
  }

  return null;
};

const syncStoredSessionState = async (session: {
  token: string | null;
  userId: string | null;
  user: any;
  raw: any;
}) => {
  if (!isResolvedApiUserId(session.userId)) {
    return;
  }

  try {
    const requestConfig = {
      headers: {
        Accept: '*/*',
        ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
    };

    const uid = session.userId;
    const [privacyResult, completionResult, profileResult] = await Promise.allSettled([
      axios.get(`${APIURL}/privacy/status`, { ...requestConfig, params: { userId: uid } }),
      axios.post(`${APIURL}/profile/completion`, null, { ...requestConfig, params: { userId: uid } }),
      axios.post(`${APIURL}/profile/me`, null, { ...requestConfig, params: { userId: uid } }),
    ]);

    if (privacyResult.status === 'fulfilled' && privacyResult.value?.data === true) {
      await AsyncStorage.setItem(STORAGE_KEYS.acceptedTerms, 'true');
    }

    const profile =
      profileResult.status === 'fulfilled'
        ? profileResult.value?.data
        : session.user?.profile || session.user || session.raw?.profile || null;

    const selectedGender = resolveStoredGenderSelection(profile);
    if (selectedGender) {
      await AsyncStorage.setItem(STORAGE_KEYS.selectedGender, selectedGender);
    }

    const completionValue =
      completionResult.status === 'fulfilled' ? Number(completionResult.value?.data) : Number.NaN;
    const hasImages = Array.isArray(profile?.images) && profile.images.some(Boolean);
    const hasProfilePhoto = Boolean(profile?.profileImageUrl) || hasImages;
    const looksComplete =
      (Number.isFinite(completionValue) && completionValue >= 60) ||
      (Boolean(profile?.displayName) && hasProfilePhoto);

    if (looksComplete) {
      await AsyncStorage.setItem(STORAGE_KEYS.entryHomeScreen, 'true');
    }
  } catch (error) {
    console.warn('[saveAuthSession] Failed to hydrate session progress:', describeError(error));
  }
};

export const extractSession = (data: any) => {
  const payload = Array.isArray(data) ? (data[0] || {}) : (data ?? {});
  const authorizationHeader = normalizeStoredString(
    payload?.__headers?.authorization ||
    payload?.__headers?.Authorization ||
    payload?.headers?.authorization ||
    payload?.headers?.Authorization ||
    null
  );
  const bearerTokenFromHeader =
    authorizationHeader?.toLowerCase().startsWith('bearer ')
      ? authorizationHeader.slice(7).trim()
      : authorizationHeader;
  const token = normalizeStoredString(
    payload?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    payload?.jwt ||
    payload?.jwtToken ||
    payload?.idToken ||
    payload?.authToken ||
    payload?.data?.token ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    payload?.data?.jwt ||
    payload?.data?.jwtToken ||
    payload?.data?.idToken ||
    payload?.data?.authToken ||
    bearerTokenFromHeader ||
    null
  );

  const userIdCandidate = 
    payload?.uid ||
    payload?.data?.uid ||
    payload?.user?.uid ||
    payload?.userId ||
    payload?.id ||
    payload?.user?.id ||
    payload?.data?.userId ||
    payload?.data?.id ||
    payload?.user_id ||
    payload?.data?.user_id ||
    payload?.profileId ||
    payload?.data?.profileId ||
    null;

  const userIdCandidateRaw = normalizeStoredString(userIdCandidate);
  const userId = isResolvedApiUserId(userIdCandidateRaw) ? userIdCandidateRaw! : null;
  const user = payload?.user || payload?.data?.user || null;

  return { token, userId, user, raw: payload };
};

export const hasPersistableSession = (data: any) => {
  const session = extractSession(data);
  return Boolean(session.token && isResolvedApiUserId(session.userId));
};

export const hasSessionToken = (data: any) => {
  const session = extractSession(data);
  return Boolean(session.token);
};

export const saveAuthSession = async (data: any) => {
  let session = extractSession(data);

  if (session.token && !isResolvedApiUserId(session.userId)) {
    session = await resolveSessionIdentityFromApi(session);
  }

  if (session.token) {
    await AsyncStorage.setItem(STORAGE_KEYS.token, session.token);
    await AsyncStorage.setItem('userToken', session.token);
    await AsyncStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
    if (session.userId) {
      await AsyncStorage.setItem(STORAGE_KEYS.userId, String(session.userId));
      await AsyncStorage.setItem('userId', String(session.userId));
      await AsyncStorage.removeItem('userMobile');
      await AsyncStorage.removeItem(USER_VERIFIED_KEY);
    } else {
      const fallbackSubject = resolveTokenSubject(session.token) || 
        normalizeStoredString(session.user?.mobile) || 
        normalizeStoredString(session.raw?.mobile);
      if (fallbackSubject && isMobileSubjectCandidate(fallbackSubject)) {
        await AsyncStorage.multiSet([
          ['userMobile', fallbackSubject],
        ]);
        await AsyncStorage.multiRemove([STORAGE_KEYS.userId, 'userId', USER_VERIFIED_KEY]);
        if (__DEV__) console.log('[session] Numeric userId is unavailable; stored mobile subject separately for later repair.');
      } else {
        await AsyncStorage.multiRemove([STORAGE_KEYS.userId, 'userId', 'userMobile', USER_VERIFIED_KEY]);
      }
    }
  }

  if (session.user) {
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
  }

  const profile = session.user?.profile || session.raw?.profile || null;
  const selectedGender = resolveStoredGenderSelection(profile);
  if (selectedGender) {
    await AsyncStorage.setItem(STORAGE_KEYS.selectedGender, selectedGender);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(session.raw || {}));

  try {
    await AsyncStorageService.setUser({
      ...(session.raw || {}),
      ...(session.token ? { token: session.token } : {}),
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.user ? { user: session.user } : {}),
    });
  } catch (error) {
    console.warn('[saveAuthSession] Failed to sync encrypted session:', describeError(error));
  }

  await syncStoredSessionState(session);
  return session;
};

export const resolveInitialRoute = async (): Promise<string> => {
  // Load verified identity cache before any userId checks
  await initVerifiedIdentityCache();

  let entries = await AsyncStorage.multiGet([
    STORAGE_KEYS.isLoggedIn,
    STORAGE_KEYS.acceptedTerms,
    STORAGE_KEYS.onboardingStep,
    STORAGE_KEYS.entryHomeScreen,
    STORAGE_KEYS.token,
    STORAGE_KEYS.userId,
  ]);

  const values = Object.fromEntries(entries);
  const isLoggedIn = values[STORAGE_KEYS.isLoggedIn] === 'true';
  const acceptedTerms = values[STORAGE_KEYS.acceptedTerms] === 'true';
  const rawOnboardingStep = values[STORAGE_KEYS.onboardingStep];
  const onboardingStep =
    acceptedTerms && rawOnboardingStep === 'Privacy'
      ? null
      : rawOnboardingStep;
  const onboardingComplete = values[STORAGE_KEYS.entryHomeScreen] === 'true';
  
  if (__DEV__) {
      console.log('[session] resolveInitialRoute:', { isLoggedIn, acceptedTerms, onboardingStep, onboardingComplete });
  }

  if (!isLoggedIn) {
     return 'Login';
  }

  let storedUserId = values[STORAGE_KEYS.userId];
  const storedToken = values[STORAGE_KEYS.token];

  if (storedToken) {
    if (!acceptedTerms || !onboardingComplete) {
      const scopedState = await restoreScopedOnboardingState(storedToken);
      const pendingWrites: Array<[string, string]> = [];

      if (!acceptedTerms && scopedState.acceptedTerms) {
        pendingWrites.push([STORAGE_KEYS.acceptedTerms, 'true']);
      }

      if (!onboardingComplete && scopedState.onboardingComplete) {
        pendingWrites.push([STORAGE_KEYS.entryHomeScreen, 'true']);
      }

      if (pendingWrites.length) {
        await AsyncStorage.multiSet(pendingWrites);
        entries = await AsyncStorage.multiGet([
          STORAGE_KEYS.isLoggedIn,
          STORAGE_KEYS.acceptedTerms,
          STORAGE_KEYS.onboardingStep,
          STORAGE_KEYS.entryHomeScreen,
          STORAGE_KEYS.token,
          STORAGE_KEYS.userId,
        ]);
        Object.assign(values, Object.fromEntries(entries));
      }
    }

    if (!isResolvedApiUserId(storedUserId)) {
      const repairedUserId = await repairStoredSessionIdentity();
      if (repairedUserId) {
        storedUserId = repairedUserId;
      }
    }

    const hydratedSession = await getAuthSession();
    await syncStoredSessionState({
      token: hydratedSession.token,
      userId: storedUserId || hydratedSession.userId,
      user: hydratedSession.user,
      raw: hydratedSession.raw,
    });

    entries = await AsyncStorage.multiGet([
      STORAGE_KEYS.isLoggedIn,
      STORAGE_KEYS.acceptedTerms,
      STORAGE_KEYS.onboardingStep,
      STORAGE_KEYS.entryHomeScreen,
      STORAGE_KEYS.token,
      STORAGE_KEYS.userId,
    ]);
    Object.assign(values, Object.fromEntries(entries));
  }

  const acceptedTermsAfterHydration = values[STORAGE_KEYS.acceptedTerms] === 'true';
  const rawOnboardingStepAfterHydration = values[STORAGE_KEYS.onboardingStep];
  const onboardingStepAfterHydration =
    acceptedTermsAfterHydration && rawOnboardingStepAfterHydration === 'Privacy'
      ? null
      : rawOnboardingStepAfterHydration;
  const onboardingCompleteAfterHydration = values[STORAGE_KEYS.entryHomeScreen] === 'true';

  if (!isResolvedApiUserId(storedUserId) && __DEV__) {
     console.log('[session] Route resolution continuing without a resolved API userId yet.');
  }

  if (!onboardingCompleteAfterHydration && onboardingStepAfterHydration && ONBOARDING_ROUTES.has(onboardingStepAfterHydration)) {
     if (__DEV__) console.log('[session] Routes: Resuming onboarding at', onboardingStepAfterHydration);
     return onboardingStepAfterHydration;
  }

  if (!acceptedTermsAfterHydration) {
    return 'Privacy';
  }

  return onboardingCompleteAfterHydration ? 'BottomTabs' : 'GenderOrientation';
};
