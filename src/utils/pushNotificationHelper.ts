import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { navigationRef, navigate } from './navigationHelper';

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

      if (typeof fcm.requestPermission === 'function') {
        await fcm.requestPermission().catch(() => null);
      }

      if (typeof fcm.getToken === 'function') {
        const token = await fcm.getToken();
        if (token && typeof token === 'string' && token.length > 20) {
          await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
          console.log('\n==========================================\n🔥 [REAL FCM TOKEN FOR FIREBASE CONSOLE]:\n' + token + '\n==========================================\n');
          return token;
        }
      }
    }
  } catch (err: any) {
    if (__DEV__) {
      console.log('⚠️ [Push] Native Firebase getToken attempt:', err?.message || err);
    }
  }

  // 2. Return cached real token if exists (ignore old fcm_dev_ fallback tokens)
  const cached = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (cached && !cached.startsWith('fcm_dev_')) {
    return cached;
  }

  // 3. Fallback dev token only if native Firebase is completely unavailable
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
      fcmToken: token,
      platform: Platform.OS,
    };

    console.log('📱 [Push] Sending device token to backend POST /notification/push:', payload);

    const res = await apiClient.post('/notification/push', payload);
    console.log('✅ [Push] Device token registered with backend (Status ' + res?.status + '):', res?.data);
    return true;
  } catch (err: any) {
    console.warn('⚠️ [Push] Failed to register device token with backend:', err?.message);
    return false;
  }
};

/**
 * Handle routing when user taps a push notification (foreground toast or system tray)
 */
export const handleNotificationNavigation = async (data: any) => {
  if (!data) return;

  try {
    let isMan = true;
    try {
      const [g1, g2] = await Promise.all([
        AsyncStorage.getItem('userGender'),
        AsyncStorage.getItem('selectedGender'),
      ]);
      const g = (g1 || g2 || '').toLowerCase();
      isMan = !g.includes('woman') && !g.includes('female');
    } catch {
      isMan = true;
    }

    const screen = String(data.screen || '').toLowerCase();
    const type = String(data.type || '').toUpperCase();
    const tab = data.tab ? String(data.tab).toLowerCase() : undefined;
    const targetUserId = data.userId || data.targetUserId || data.senderId;

    // 0. Direct Profile navigation (if backend passes target user ID and requested profile screen)
    if (targetUserId && (screen.includes('profile') || screen.includes('user') || data.openProfile === 'true')) {
      navigate('ViewMyProfileScreen', {
        userId: targetUserId,
        targetUserId: targetUserId,
      });
      return;
    }

    // 1. Invitations / Date Proposals
    if (screen.includes('invit') || type.includes('INVIT') || type.includes('PROPOSAL')) {
      if (isMan) {
        navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: tab || 'pending' },
        });
      } else {
        navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: tab || 'pending' },
        });
      }
      return;
    }

    // 2. Matches & Accepted Proposals
    if (screen.includes('sent') || type.includes('MATCH') || type.includes('ACCEPT') || type.includes('APPROV')) {
      if (isMan) {
        navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: tab || 'accepted' },
        });
      } else {
        navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: tab || 'accepted' },
        });
      }
      return;
    }

    // 3. Profile / Settings
    if (screen.includes('profile')) {
      navigate('BottomTabs', { screen: 'Profile' });
      return;
    }

    // Fallback: Default to Notifications or Home
    navigate('BottomTabs', { screen: isMan ? 'Home' : 'Invitations' });
  } catch (err) {
    console.warn('⚠️ [Push] Error in handleNotificationNavigation:', err);
  }
};

/**
 * Initialize Push Notification listeners for Foreground, Background, and Quit states
 */
export const setupPushNotificationListeners = (
  onForegroundNotification?: (remoteMessage: any) => void
): (() => void) => {
  let unsubscribeOnMessage: (() => void) | undefined;
  let unsubscribeOnOpened: (() => void) | undefined;

  try {
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule.default || messagingModule;
    if (messaging && typeof messaging === 'function') {
      const fcm = messaging();

      // 1. Foreground message handler
      if (typeof fcm.onMessage === 'function') {
        unsubscribeOnMessage = fcm.onMessage(async (remoteMessage: any) => {
          if (__DEV__) {
            console.log('📬 [Push] Foreground push message received:', remoteMessage);
          }
          if (onForegroundNotification) {
            onForegroundNotification(remoteMessage);
          }
        });
      }

      // 2. Background tap handler (app in background and user taps system banner)
      if (typeof fcm.onNotificationOpenedApp === 'function') {
        unsubscribeOnOpened = fcm.onNotificationOpenedApp((remoteMessage: any) => {
          if (__DEV__) {
            console.log('🔔 [Push] Notification opened from background:', remoteMessage);
          }
          handleNotificationNavigation(remoteMessage?.data);
        });
      }

      // 3. Quit state tap handler (app closed completely and opened via notification)
      if (typeof fcm.getInitialNotification === 'function') {
        fcm.getInitialNotification().then((remoteMessage: any) => {
          if (remoteMessage) {
            if (__DEV__) {
              console.log('🚀 [Push] App launched from quit state by notification:', remoteMessage);
            }
            handleNotificationNavigation(remoteMessage?.data);
          }
        }).catch(() => null);
      }
    }
  } catch (err) {
    if (__DEV__) {
      console.log('[Push] Native Firebase messaging listeners could not be initialized yet.');
    }
  }

  return () => {
    if (typeof unsubscribeOnMessage === 'function') {
      unsubscribeOnMessage();
    }
    if (typeof unsubscribeOnOpened === 'function') {
      unsubscribeOnOpened();
    }
  };
};

