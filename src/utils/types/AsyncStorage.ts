// utils/genderStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

export const saveGender = async (gender: string) => {
  try {
    console.log('gender',gender);
    
    await AsyncStorage.setItem('selectedGender', gender);
  } catch (e) {
    console.error('Error saving gender:', e);
  }
};

export const getGender = async (): Promise<string | null> => {
  try {
    const gender = await AsyncStorage.getItem('selectedGender');
    return gender;
  } catch (e) {
    console.error('Error getting gender:', e);
    return null;
  }
};

export class AsyncStorageService {
  static USER = 'user';
  static TOKEN = 'auth_token';

  static async setToken(token: string) {
    await EncryptedStorage.setItem(AsyncStorageService.TOKEN, token);
  }

  static async getToken(): Promise<string | null> {
    return EncryptedStorage.getItem(AsyncStorageService.TOKEN);
  }

  static async clearToken() {
    await EncryptedStorage.removeItem(AsyncStorageService.TOKEN);
  }

  // Encrypt and store user data securely
  static async setUser(data: any) {
    try {
      // Encrypting data before storing
      const encryptedData = JSON.stringify(data);
      await EncryptedStorage.setItem(AsyncStorageService.USER, encryptedData);
      console.log('User data saved securely.');
    } catch (e) {
      console.error('Error saving user data securely:', e);
    }
  }

  // Decrypt and retrieve user data securely
  static async getUser() {
    try {
      const encryptedData = await EncryptedStorage.getItem(AsyncStorageService.USER);
      if (encryptedData !== null) {
        return JSON.parse(encryptedData);
      }
      return null;
    } catch (e) {
      console.error('Error retrieving user data:', e);
      return Promise.reject(e);
    }
  }

  // Clear user data securely
  static async clearUser() {
    try {
      await EncryptedStorage.removeItem(AsyncStorageService.USER);
      console.log('User data cleared securely.');
    } catch (e) {
      console.error('Error clearing user data securely:', e);
    }
  }
}


export const isFirstImageUploaded = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem('firstImageUploaded');
  return value === 'true';
};

export const markFirstImageUploaded = async (): Promise<void> => {
  await AsyncStorage.setItem('firstImageUploaded', 'true');
};

export interface SavedSearchFilters {
  isFilterActive?: boolean;
  minAge?: number;
  maxAge?: number;
  maxDistanceKm?: number;
  searchRadius?: number;
  radius?: number;
  worldwide?: boolean;
  location?: string;
  city?: string;
  minHeight?: number;
  maxHeight?: number;
  bodyType?: string[];
  appearance?: string[];
  language?: string[];
  englishLevel?: string[];
  ethnicity?: string[];
  lookingFor?: string[];
  gender?: string[];
  showMe?: 'straight_man' | 'straight_woman' | 'both' | null;
  smoke?: string | boolean;
  drink?: string | boolean;
  onlyOnline?: boolean;
  sortBy?: string;
  hasExplicitDistance?: boolean;
}

export const getActiveFilterCount = (filters?: SavedSearchFilters | null): number => {
  if (!filters) return 0;
  let count = 0;

  if (
    (filters.minAge !== undefined && filters.minAge > 18) ||
    (filters.maxAge !== undefined && filters.maxAge !== 40)
  ) {
    count++;
  }

  if (
    (filters.maxDistanceKm !== undefined && filters.maxDistanceKm !== 50) ||
    filters.worldwide === true
  ) {
    count++;
  }

  if (
    (filters.minHeight !== undefined && filters.minHeight > 120) ||
    (filters.maxHeight !== undefined && filters.maxHeight < 200)
  ) {
    count++;
  }

  if (
    filters.location &&
    filters.location.trim().length > 0 &&
    filters.location !== 'My current location' &&
    filters.location !== 'Mumbai, India'
  ) {
    count++;
  }

  if (filters.showMe === 'straight_man' || filters.showMe === 'both') {
    count++;
  }

  if (Array.isArray(filters.bodyType) && filters.bodyType.length > 0) {
    count += filters.bodyType.length;
  }
  if (Array.isArray(filters.appearance) && filters.appearance.length > 0) {
    count += filters.appearance.length;
  }
  if (Array.isArray(filters.language) && filters.language.length > 0) {
    count += filters.language.length;
  }
  if (Array.isArray(filters.englishLevel) && filters.englishLevel.length > 0) {
    count += filters.englishLevel.length;
  }
  if (Array.isArray(filters.ethnicity) && filters.ethnicity.length > 0) {
    count += filters.ethnicity.length;
  }
  if (Array.isArray(filters.lookingFor) && filters.lookingFor.length > 0) {
    count += filters.lookingFor.length;
  }

  if (filters.smoke !== undefined && filters.smoke !== null && filters.smoke !== '') {
    count++;
  }
  if (filters.onlyOnline === true) {
    count++;
  }

  return count;
};

export const saveSearchFilters = async (
  filters: SavedSearchFilters,
  userId?: string | number | null
): Promise<void> => {
  try {
    // Filters are per account. Never mirror them to the global key when a
    // user is known, otherwise the next account inherits them.
    const key = userId ? `@search_filters_${userId}` : '@search_filters';
    await AsyncStorage.setItem(key, JSON.stringify(filters));
  } catch (e) {
    console.error('Error saving search filters:', e);
  }
};

export const getSavedSearchFilters = async (
  userId?: string | number | null
): Promise<SavedSearchFilters | null> => {
  try {
    let raw = null;
    if (userId) {
      // Only the scoped key. Falling back to the global key leaked one
      // account's filters into every other account.
      raw = await AsyncStorage.getItem(`@search_filters_${userId}`);
    } else {
      raw = await AsyncStorage.getItem('@search_filters');
    }
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (e) {
    console.error('Error getting search filters:', e);
    return null;
  }
};

export const clearSavedSearchFilters = async (
  userId?: string | number | null
): Promise<void> => {
  try {
    if (userId) {
      await AsyncStorage.removeItem(`@search_filters_${userId}`);
    }
    await AsyncStorage.removeItem('@search_filters');
  } catch (e) {
    console.error('Error clearing search filters:', e);
  }
};

const BLOCKED_USERS_PREFIX = '@amara_blocked_users_';

export const saveBlockedUser = async (
  currentUserId: string | number,
  targetUserId: string | number
): Promise<void> => {
  try {
    const key = `${BLOCKED_USERS_PREFIX}${currentUserId}`;
    const raw = await AsyncStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const targetStr = String(targetUserId).trim();
    if (targetStr && !list.includes(targetStr)) {
      list.push(targetStr);
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save blocked user locally:', e);
  }
};

export const removeBlockedUser = async (
  currentUserId: string | number,
  targetUserId: string | number
): Promise<void> => {
  try {
    const key = `${BLOCKED_USERS_PREFIX}${currentUserId}`;
    const raw = await AsyncStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const targetStr = String(targetUserId).trim();
    const updated = list.filter((id) => id !== targetStr);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to remove blocked user locally:', e);
  }
};

export const getLocalBlockedUsers = async (
  currentUserId?: string | number | null
): Promise<string[]> => {
  if (!currentUserId) return [];
  try {
    const key = `${BLOCKED_USERS_PREFIX}${currentUserId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to get local blocked users:', e);
    return [];
  }
};

export const clearBlockedUsers = async (
  currentUserId: string | number
): Promise<void> => {
  try {
    const key = `${BLOCKED_USERS_PREFIX}${currentUserId}`;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear blocked users:', e);
  }
};

const DELETED_ACCOUNTS_KEY = '@amara_deleted_accounts';
const PENDING_DELETION_PREFIX = '@amara_pending_deletion_';
const PENDING_DELETION_EMAIL_PREFIX = '@amara_pending_deletion_email_';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const recordDeletedAccountLocally = async (
  userId: string | number | null | undefined,
  email?: string | null | undefined
): Promise<void> => {
  if (!userId) return;
  try {
    const idStr = String(userId).trim();
    if (!idStr) return;

    const raw = await AsyncStorage.getItem(DELETED_ACCOUNTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(idStr)) {
      list.push(idStr);
      await AsyncStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(list));
    }

    // Record pending deletion schedule with 30-day window
    const now = Date.now();
    const pendingInfo = {
      userId: idStr,
      scheduledAt: now,
      expiresAt: now + THIRTY_DAYS_MS,
      email: email ? String(email).trim().toLowerCase() : undefined,
    };
    await AsyncStorage.setItem(`${PENDING_DELETION_PREFIX}${idStr}`, JSON.stringify(pendingInfo));

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail) {
        await AsyncStorage.setItem(`${PENDING_DELETION_EMAIL_PREFIX}${cleanEmail}`, idStr);
      }
    }

    // Also remove from @amara_registered_profiles so it never re-appears in local discovery
    const rawReg = await AsyncStorage.getItem('@amara_registered_profiles');
    if (rawReg) {
      const regList = JSON.parse(rawReg);
      if (Array.isArray(regList)) {
        const filtered = regList.filter((item: any) => {
          const itemUid = String(item?.userId || item?.id || item?.uid || item?.profile?.userId || '').trim();
          return itemUid !== idStr;
        });
        await AsyncStorage.setItem('@amara_registered_profiles', JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('Failed to record deleted account locally:', e);
  }
};

export const removeDeletedAccountLocally = async (
  userId: string | number | null | undefined,
  email?: string | null | undefined
): Promise<void> => {
  if (!userId) return;
  try {
    const idStr = String(userId).trim();
    if (!idStr) return;

    const raw = await AsyncStorage.getItem(DELETED_ACCOUNTS_KEY);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      const filtered = list.filter((id) => id !== idStr);
      await AsyncStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(filtered));
    }

    await AsyncStorage.removeItem(`${PENDING_DELETION_PREFIX}${idStr}`);

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail) {
        await AsyncStorage.removeItem(`${PENDING_DELETION_EMAIL_PREFIX}${cleanEmail}`);
      }
    }
  } catch (e) {
    console.warn('Failed to remove deleted account locally:', e);
  }
};

export const isAccountPendingDeletion = async (
  userId: string | number | null | undefined
): Promise<boolean> => {
  if (!userId) return false;
  try {
    const idStr = String(userId).trim();
    if (!idStr) return false;
    const raw = await AsyncStorage.getItem(`${PENDING_DELETION_PREFIX}${idStr}`);
    if (!raw) return false;
    const info = JSON.parse(raw);
    if (info?.expiresAt && Date.now() > info.expiresAt) {
      // 30 days passed, expired
      await removeDeletedAccountLocally(idStr, info?.email);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getPendingDeletionUserIdByEmail = async (
  email: string | null | undefined
): Promise<string | null> => {
  if (!email) return null;
  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const storedUid = await AsyncStorage.getItem(`${PENDING_DELETION_EMAIL_PREFIX}${cleanEmail}`);
    if (!storedUid) return null;
    const isPending = await isAccountPendingDeletion(storedUid);
    if (!isPending) return null;
    return storedUid;
  } catch {
    return null;
  }
};

export const getLocalDeletedAccounts = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(DELETED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

