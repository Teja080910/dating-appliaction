import './src/theme/globalFontScaler';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Routes from './src/screens/Navigations/Routes';
import GlobalStateProvider from './src/context/GlobalStateProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform, PermissionsAndroid, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/AmaraToast';
import AppContext from './src/context/CreateGlobalStateContext';
import { getUserId } from './src/utils/sessionHelper';
import { initLanguage } from './src/i18n';
import { useServices } from './src/api/useMisc';
import { useSubscription } from './src/api/useSubscription';
import { useConnection } from './src/api/useConnection';
import {
  registerDeviceToken,
  setupPushNotificationListeners,
  handleNotificationNavigation,
} from './src/utils/pushNotificationHelper';

const ServerSync = () => {
  const { setIsSubscribed } = useContext(AppContext);
  const [userId, setUserId] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const setOnlineRef = useRef<() => void>(() => undefined);
  const setOfflineRef = useRef<() => void>(() => undefined);
  const { setOnline, setOffline } = useServices(userId || undefined);
  const { subscriptionStatus, statusError } = useSubscription(userId);
  const { refreshAll } = useConnection(userId || undefined);

  useEffect(() => {
    setOnlineRef.current = () => setOnline.mutate();
    setOfflineRef.current = () => setOffline.mutate();
  }, [setOffline, setOnline]);

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const id = await getUserId();
        if (isMounted && id) {
          const idStr = String(id);
          setUserId((prev) => (prev !== idStr ? idStr : prev));
        } else if (isMounted && !id) {
          setUserId(null);
        }
      } catch {
        // ignore
      }
    };

    checkUser();
    const interval = setInterval(checkUser, 2500);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkUser();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    registerDeviceToken(userId).catch(() => null);
    setOnlineRef.current();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && previousState !== 'active') {
        setOnlineRef.current();
      } else if (nextState === 'background' || nextState === 'inactive') {
        setOfflineRef.current();
      }
    });

    return () => {
      setOfflineRef.current();
      subscription.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (subscriptionStatus) {
      const active = Boolean(subscriptionStatus.active);
      setIsSubscribed(active);
      if (active) {
        AsyncStorage.setItem('isSubscribed', 'true').catch(() => null);
      }
    }
  }, [setIsSubscribed, subscriptionStatus]);

  // Fast poll for updates every 5 seconds while app is active
  useEffect(() => {
    if (!userId) return;

    // Immediate refresh on mount or account switch
    refreshAll();

    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshAll();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId, refreshAll]);

  // Push notification listeners: Live FCM messages update data and display heads-up banner in foreground
  useEffect(() => {
    const unsubscribePush = setupPushNotificationListeners(async (remoteMessage: any) => {
      // Instantly refresh requests and notifications
      refreshAll();

      if (remoteMessage) {
        const title =
          remoteMessage?.notification?.title ||
          remoteMessage?.data?.title ||
          '💌 New Notification';
        const body =
          remoteMessage?.notification?.body ||
          remoteMessage?.data?.body ||
          remoteMessage?.data?.message ||
          '';

        Toast.show({
          type: 'info',
          text1: title,
          text2: body,
          visibilityTime: 4000,
          onPress: () => {
            Toast.hide();
            handleNotificationNavigation(remoteMessage);
          },
        });
      }
    });

    return () => {
      unsubscribePush();
    };
  }, [refreshAll]);

  return null;
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initLanguage();

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      ).catch(() => null);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalStateProvider>
          <ServerSync />
          <Routes />
          <Toast
            config={toastConfig}
            topOffset={Platform.OS === 'ios' ? 54 : ((StatusBar.currentHeight || 24) + 12)}
          />
        </GlobalStateProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

export default App;
