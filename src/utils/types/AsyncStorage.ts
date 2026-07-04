// utils/genderStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

export const saveGender = async (gender: string) => {
  try {
    await AsyncStorage.setItem('selectedGender', gender);
  } catch (e) {
  }
};

export const getGender = async (): Promise<string | null> => {
  try {
    const gender = await AsyncStorage.getItem('selectedGender');
    return gender;
  } catch (e) {
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
    } catch (e) {
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
      return Promise.reject(e);
    }
  }

  // Clear user data securely
  static async clearUser() {
    try {
      await EncryptedStorage.removeItem(AsyncStorageService.USER);
    } catch (e) {
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
