import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './types/AsyncStorage';
import { isResolvedApiUserId, repairStoredSessionIdentity } from './session';
import { getAuthToken as getAuthTokenFromState, STORAGE_KEYS } from './sessionState';

const describeError = (error: any) => ({
  message: String(error?.message || 'Unknown error'),
  status: Number(error?.response?.status || 0) || null,
});

const normalizeUserId = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized === '0' || normalized === 'undefined' || normalized === 'null') {
    return null;
  }

  if (/^\d{10,}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

const shouldRepairUserId = (value: unknown) => {
  const normalized = normalizeUserId(value);
  return !normalized || /^\d{10,}$/.test(String(value ?? '').trim());
};

/**
 * Robustly retrieve the userId from multiple storage sources.
 * Returns null if not found.
 */
export const getUserId = async (): Promise<string | null> => {
  let userId: string | number | null = null;

  // Source 1: AsyncStorage direct key (fastest)
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.userId);
    if (stored && stored !== '' && stored !== '0' && stored !== 'undefined' && stored !== 'null') {
      userId = stored;
    }
  } catch (e) {
    console.warn('[getUserId] AsyncStorage direct read failed:', e);
  }

  // Source 2: EncryptedStorage via AsyncStorageService
  if (!userId) {
    try {
      const user = await AsyncStorageService.getUser();
      if (user) {
        userId = user?.user?.id || user?.id || user?.user?.userId || user?.userId ||
                 user?.data?.user?.id || user?.data?.id;
      }
    } catch (e) {
      console.warn('[getUserId] EncryptedStorage read failed:', e);
    }
  }

  // Source 3: AsyncStorage user_data backup
  if (!userId) {
    try {
      const backup = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (backup) {
        const parsed = JSON.parse(backup);
        userId = parsed?.user?.id || parsed?.id || parsed?.userId ||
                 parsed?.data?.user?.id || parsed?.data?.id;
      }
    } catch (e) {
      console.warn('[getUserId] Backup user_data read failed:', e);
    }
  }

  const normalizedUserId = normalizeUserId(userId);

  if (normalizedUserId && isResolvedApiUserId(normalizedUserId)) {
    return normalizedUserId;
  }

  if (shouldRepairUserId(normalizedUserId)) {
    try {
      const repairedUserId = await repairStoredSessionIdentity();
      if (repairedUserId && isResolvedApiUserId(repairedUserId)) {
        return repairedUserId;
      }
    } catch (e) {
      console.warn('[getUserId] Session identity repair failed:', describeError(e));
    }
  }

  if (normalizedUserId) {
    console.warn('[getUserId] Ignoring unresolved stored userId:', normalizedUserId);
  }

  return null;
};


/**
 * Robustly retrieve the auth token from multiple storage sources.
 */
export const getAuthToken = getAuthTokenFromState;

export const clearSession = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.userId,
    'userToken',
    'userMobile',
  ]);
};
