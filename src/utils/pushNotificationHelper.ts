import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_KEY = '@amara_device_token';

/**
 * Safely obtain or generate a persistent device token
 */
export const getDeviceToken = async (): Promise<string> => {
  try {
    // 1. Try Firebase Messaging if available
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule.default || messagingModule;
    if (messaging && typeof messaging === 'function') {
      const fcm = messaging();
      if (fcm && typeof fcm.getToken === 'function') {
        const token = await fcm.getToken();
        if (token) {
          await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
          return token;
        }
      }
    }
  } catch (err) {
    // Firebase not initialized or google-services.json pending
    if (__DEV__) {
      console.log('[Push] Native Firebase messaging not available yet, using cached or fallback token.');
    }
  }

  // 2. Return cached token if exists
  const cached = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (cached) return cached;

  // 3. Fallback persistent device token
  const fallbackToken = `fcm_dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_TOKEN_KEY, fallbackToken);
  return fallbackToken;
};

/**
 * Register device push token with the backend server
 */
export const registerDeviceToken = async (userId: string | number): Promise<boolean> => {
  if (!userId) return false;

  try {
    // Request Android 13+ notification permissions
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      ).catch(() => null);
    }

    const token = await getDeviceToken();

    const payload = {
      userId: String(userId),
      token,
      deviceToken: token,
      platform: Platform.OS,
    };

    if (__DEV__) {
      console.log('📱 [Push] Registering device token with backend:', payload);
    }

    const res = await apiClient.post('/notification/push', payload);
    if (__DEV__) {
      console.log('✅ [Push] Device token registered successfully:', res?.data);
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ [Push] Failed to register device token with backend:', err?.message);
    return false;
  }
};
