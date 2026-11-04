import './src/theme/globalFontScaler';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Routes from './src/screens/Navigations/Routes';
import GlobalStateProvider from './src/context/GlobalStateProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Toast from 'react-native-toast-message';
import AppContext from './src/context/CreateGlobalStateContext';
import { getUserId } from './src/utils/sessionHelper';
import { initLanguage } from './src/i18n';
import { useServices } from './src/api/useMisc';
import { useSubscription } from './src/api/useSubscription';
import { useConnection } from './src/api/useConnection';
import {
  registerDeviceToken,
  setupPushNotificationListeners,
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
    getUserId()
      .then((id) => {
        if (isMounted && id) {
          setUserId(String(id));
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
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

  // Push notification listeners: Live FCM messages update data silently in foreground
  useEffect(() => {
    const unsubscribePush = setupPushNotificationListeners(async () => {
      // Instantly refresh requests and notifications
      refreshAll();
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
    <QueryClientProvider client={queryClient}>
      <GlobalStateProvider>
        <ServerSync />
        <Routes />
        <Toast />
      </GlobalStateProvider>
    </QueryClientProvider>
  );
};

export default App;
