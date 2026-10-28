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
}

export const getActiveFilterCount = (filters?: SavedSearchFilters | null): number => {
  if (!filters) return 0;
  let count = 0;

  if (
    (filters.minAge !== undefined && filters.minAge > 18) ||
    (filters.maxAge !== undefined && filters.maxAge < 40)
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
  if (filters.drink !== undefined && filters.drink !== null && filters.drink !== '') {
    count++;
  }

  return count;
};

export const saveSearchFilters = async (
  filters: SavedSearchFilters,
  userId?: string | number | null
): Promise<void> => {
  try {
    const key = userId ? `@search_filters_${userId}` : '@search_filters';
    await AsyncStorage.setItem(key, JSON.stringify(filters));
    // Also save under global key as fallback
    await AsyncStorage.setItem('@search_filters', JSON.stringify(filters));
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
      raw = await AsyncStorage.getItem(`@search_filters_${userId}`);
    }
    if (!raw) {
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
