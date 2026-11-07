import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { navigationRef, navigate } from './navigationHelper';

const DEVICE_TOKEN_KEY = '@amara_device_token';

/**
 * Checks whether a token is a real valid Firebase Cloud Messaging token
 */
export const isRealFcmToken = (token?: string | null): boolean => {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.length > 25 && !trimmed.startsWith('fcm_dev_');
};

/**
 * Safely obtain or generate a persistent device token with automatic retry
 */
export const getDeviceToken = async (): Promise<string> => {
  try {
    // 1. Try Firebase Messaging if available
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule.default || messagingModule;
    if (messaging && typeof messaging === 'function') {
      const fcm = messaging();

      if (typeof fcm.registerDeviceForRemoteMessages === 'function') {
        await fcm.registerDeviceForRemoteMessages().catch(() => null);
      }

      if (typeof fcm.requestPermission === 'function') {
        await fcm.requestPermission().catch(() => null);
      }

      if (typeof fcm.getToken === 'function') {
        let token = await fcm.getToken().catch(() => null);

        // Quick retry if Google Play Services needed a moment
        if (!token) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          token = await fcm.getToken().catch(() => null);
        }

        if (isRealFcmToken(token)) {
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

  // 2. Return cached real token if exists
  const cached = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (isRealFcmToken(cached)) {
    return cached as string;
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

    // If we only had a fallback token, retry obtaining a real token shortly
    if (!isRealFcmToken(token)) {
      setTimeout(async () => {
        try {
          const freshToken = await getDeviceToken();
          if (isRealFcmToken(freshToken)) {
            await apiClient.post('/notification/push', {
              userId: String(userId),
              token: freshToken,
              deviceToken: freshToken,
              fcmToken: freshToken,
              platform: Platform.OS,
            });
            console.log('🔄 [Push] Successfully upgraded to real FCM token for user', userId);
          }
        } catch {
          // ignore retry failure
        }
      }, 3000);
    }

    return true;
  } catch (err: any) {
    console.warn('⚠️ [Push] Failed to register device token with backend:', err?.message);
    return false;
  }
};

/**
 * Handle routing when user taps a push notification (foreground toast or system tray)
 */
export const handleNotificationNavigation = async (dataOrMessage: any) => {
  if (!dataOrMessage) return;

  try {
    const rawData = dataOrMessage?.data || {};
    const rawNotification = dataOrMessage?.notification || {};
    const data = {
      ...(typeof dataOrMessage === 'object' ? dataOrMessage : {}),
      ...rawNotification,
      ...rawData,
    };

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

    const screen = String(data.screen || data.route || '').toLowerCase();
    const type = String(data.type || data.notificationType || '').toUpperCase();
    const title = String(data.title || rawNotification.title || '').toLowerCase();
    const message = String(data.message || data.body || rawNotification.body || '').toLowerCase();
    const tab = data.tab || data.initialTab ? String(data.tab || data.initialTab).toLowerCase() : undefined;
    const targetUserId = data.userId || data.targetUserId || data.senderId || data.receiverId;

    if (__DEV__) {
      console.log('🔔 [Push] Handling notification navigation:', {
        screen,
        type,
        title,
        message,
        tab,
        targetUserId,
        isMan,
      });
    }

    // 0. Direct Profile navigation (if backend passes target user ID and requested profile screen)
    if (targetUserId && (screen.includes('profile') || screen.includes('user') || data.openProfile === 'true')) {
      navigate('ViewMyProfileScreen', {
        userId: targetUserId,
        targetUserId: targetUserId,
      });
      return;
    }

    // 1. Matches & Accepted Proposals / Connection Approvals
    const isAcceptedMatch =
      screen.includes('sent') ||
      type.includes('MATCH') ||
      type.includes('ACCEPT') ||
      type.includes('APPROV') ||
      title.includes('accepted') ||
      title.includes('approved') ||
      title.includes('match') ||
      message.includes('accepted') ||
      message.includes('approved') ||
      message.includes('match') ||
      message.includes('telegram') ||
      tab === 'accepted';

    if (isAcceptedMatch) {
      if (isMan) {
        navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: 'accepted' },
        });
      } else {
        navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: 'accepted' },
        });
      }
      return;
    }

    // 2. Incoming Invitations & Date Proposals
    const isInvite =
      screen.includes('invit') ||
      type.includes('INVIT') ||
      type.includes('PROPOSAL') ||
      type.includes('CONNECT') ||
      title.includes('invit') ||
      title.includes('request') ||
      title.includes('proposal') ||
      message.includes('invit') ||
      message.includes('request') ||
      message.includes('proposal') ||
      message.includes('sent you') ||
      tab === 'pending';

    if (isInvite) {
      if (isMan) {
        navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: 'pending' },
        });
      } else {
        navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: 'pending' },
        });
      }
      return;
    }

    // 3. Notifications List Screen
    if (screen.includes('notif') || type.includes('NOTIF')) {
      navigate('NotificationsScreen');
      return;
    }

    // 4. Profile / Settings
    if (screen.includes('profile') || screen.includes('setting')) {
      navigate('BottomTabs', { screen: 'Profile' });
      return;
    }

    // Fallback: Default to Sent (accepted for Men) or Invitations for Women
    if (isMan) {
      navigate('BottomTabs', { screen: 'Sent', params: { initialTab: 'accepted' } });
    } else {
      navigate('BottomTabs', { screen: 'Invitations', params: { initialTab: 'pending' } });
    }
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
  let unsubscribeOnTokenRefresh: (() => void) | undefined;

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
          handleNotificationNavigation(remoteMessage);
        });
      }

      // 3. Quit state tap handler (app closed completely and opened via notification)
      if (typeof fcm.getInitialNotification === 'function') {
        fcm.getInitialNotification().then((remoteMessage: any) => {
          if (remoteMessage) {
            if (__DEV__) {
              console.log('🚀 [Push] App launched from quit state by notification:', remoteMessage);
            }
            handleNotificationNavigation(remoteMessage);
          }
        }).catch(() => null);
      }
      // 4. Token refresh handler
      if (typeof fcm.onTokenRefresh === 'function') {
        unsubscribeOnTokenRefresh = fcm.onTokenRefresh(async (newToken: string) => {
          if (newToken && typeof newToken === 'string') {
            await AsyncStorage.setItem(DEVICE_TOKEN_KEY, newToken);
            const storedUserId = await AsyncStorage.getItem('userId');
            if (storedUserId) {
              registerDeviceToken(storedUserId).catch(() => null);
            }
          }
        });
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
    if (typeof unsubscribeOnTokenRefresh === 'function') {
      unsubscribeOnTokenRefresh();
    }
  };
};

