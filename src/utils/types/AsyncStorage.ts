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
  minAge?: number;
  maxAge?: number;
  maxDistanceKm?: number;
  worldwide?: boolean;
  location?: string;
  minHeight?: number;
  maxHeight?: number;
  bodyType?: string[];
  appearance?: string[];
  language?: string[];
  englishLevel?: string[];
  ethnicity?: string[];
  lookingFor?: string[];
  gender?: string[];
  showMe?: 'straight_man' | 'straight_woman' | null;
  smoke?: boolean;
  drink?: boolean;
  onlyOnline?: boolean;
}

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
    const key = userId ? `@search_filters_${userId}` : '@search_filters';
    let raw = await AsyncStorage.getItem(key);
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
    const key = userId ? `@search_filters_${userId}` : '@search_filters';
    await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem('@search_filters');
  } catch (e) {
    console.error('Error clearing search filters:', e);
  }
};

