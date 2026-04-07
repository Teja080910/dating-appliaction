import React, { useContext, useEffect, useRef, useState } from 'react';
import Routes from './src/screens/Navigations/Routes';
import GlobalStateProvider from './src/context/GlobalStateProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Toast from 'react-native-toast-message';
import AppContext from './src/context/CreateGlobalStateContext';
import { getUserId } from './src/utils/sessionHelper';
import { useServices } from './src/api/useMisc';
import { useSubscription } from './src/api/useSubscription';

const ServerSync = () => {
  const { setIsSubscribed } = useContext(AppContext);
  const [userId, setUserId] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const setOnlineRef = useRef<() => void>(() => undefined);
  const setOfflineRef = useRef<() => void>(() => undefined);
  const { setOnline, setOffline } = useServices(userId || undefined);
  const { subscriptionStatus } = useSubscription(userId);

  useEffect(() => {
    setOnlineRef.current = () => setOnline.mutate();
    setOfflineRef.current = () => setOffline.mutate();
  }, [setOffline, setOnline]);

  useEffect(() => {
    getUserId()
      .then((id) => {
        if (id) {
          setUserId(String(id));
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

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
    if (!subscriptionStatus) {
      return;
    }

    setIsSubscribed(Boolean(subscriptionStatus.active));
    AsyncStorage.setItem('isSubscribed', subscriptionStatus.active ? 'true' : 'false')
      .catch(() => null);
  }, [setIsSubscribed, subscriptionStatus]);

  return null;
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

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
