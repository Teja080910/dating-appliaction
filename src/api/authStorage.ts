import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

const KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  USER_ID: 'user_id',
  USER_ID_NUM: 'user_id_num',
  IS_LOGGED_IN: 'isLoggedIn',
  SELECTED_GENDER: 'selectedGender',
  ACCEPTED_TERMS: 'acceptedTerms',
  GENDER_ORIENTATION: 'GenderOrientation',
  ENTRY_HOME_SCREEN: 'entryHomeScreen',
  IS_REGISTERED: 'isRegistered',
};

export const AuthStorage = {
  setToken: async (token: string) => {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  setUser: async (data: any) => {
    const numericId = (data.ID ?? data.id) ? Number(data.ID ?? data.id) : null;
    await Promise.all([
      AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data)),
      AsyncStorage.setItem(KEYS.IS_LOGGED_IN, 'true'),
      numericId !== null && !isNaN(numericId)
        ? AsyncStorage.setItem(KEYS.USER_ID_NUM, String(numericId))
        : null,
      data.userId
        ? AsyncStorage.setItem(KEYS.USER_ID, data.userId)
        : null,
    ]);
    try {
      if (data.token) {
        await EncryptedStorage.setItem(KEYS.AUTH_TOKEN, data.token);
      }
    } catch {}
  },

  getUser: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getUserId: async (): Promise<number | null> => {
    const id = await AsyncStorage.getItem(KEYS.USER_ID_NUM);
    return id ? parseInt(id, 10) : null;
  },

  getUserIdStr: async (): Promise<string | null> => {
    return AsyncStorage.getItem(KEYS.USER_ID);
  },

  clear: async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    try {
      await EncryptedStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch {}
  },

  KEYS,
};
