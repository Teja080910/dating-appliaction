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
import { mockStore } from './src/mock/mockStore';
import { registerDeviceToken } from './src/utils/pushNotificationHelper';
import { navigate } from './src/utils/navigationHelper';

const ServerSync = () => {
  const { setIsSubscribed } = useContext(AppContext);
  const [userId, setUserId] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const setOnlineRef = useRef<() => void>(() => undefined);
  const setOfflineRef = useRef<() => void>(() => undefined);
  const { setOnline, setOffline } = useServices(userId || undefined);
  const { subscriptionStatus, statusError } = useSubscription(userId);
  const { sentList, receivedList, refreshAll } = useConnection();

  const prevReceivedIdsRef = useRef<Set<string> | null>(null);
  const prevAcceptedIdsRef = useRef<Set<string> | null>(null);

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

  // Periodic poll for updates every 15 seconds while app is active
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshAll();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userId, refreshAll]);

  // In-app alert: Monitor incoming requests (for female users receiving date proposals)
  useEffect(() => {
    const list = receivedList?.data;
    if (!Array.isArray(list)) return;

    const pendingRequests = list.filter(
      (r: any) =>
        r.status !== 'ACCEPTED' &&
        r.status !== 'APPROVED' &&
        r.status !== 'CANCELLED' &&
        r.status !== 'DECLINED' &&
        r.status !== 'REJECTED'
    );

    const currentIds = new Set(pendingRequests.map((r: any) => String(r.id)));

    if (prevReceivedIdsRef.current === null) {
      prevReceivedIdsRef.current = currentIds;
      return;
    }

    const newArrivals = pendingRequests.filter(
      (r: any) => !prevReceivedIdsRef.current!.has(String(r.id))
    );

    if (newArrivals.length > 0) {
      newArrivals.forEach((item: any) => {
        const sender = item.sender || {};
        const senderName = sender.displayName || sender.name || 'Someone';
        Toast.show({
          type: 'info',
          text1: '💌 New Date Proposal!',
          text2: `${senderName} sent you a date proposal. Tap to view.`,
          visibilityTime: 6000,
          onPress: () => {
            Toast.hide();
            navigate('BottomTabs', {
              screen: 'Invitations',
              params: { initialTab: 'pending' },
            });
          },
        });

        if (userId) {
          mockStore.addNotification(
            String(userId),
            '💌 New Date Proposal!',
            `${senderName} sent you a date proposal. Tap Invitations to view.`,
            'INVITE'
          ).catch(() => null);

          AsyncStorage.getItem('userEmail').then((storedEmail) => {
            const targetEmail = storedEmail || `${userId}@amara.com`;
            mockStore.sendMockEmail({
              userId: String(userId),
              toEmail: targetEmail,
              subject: `New invitation from ${senderName} on Amara`,
              body: `Hi,\n\n${senderName} has sent you a dating invitation on Amara.\n\nOpen the app or your Telegram to review their profile and reply.\n\nBest regards,\nThe Amara Team`,
              type: 'PENDING_INVITE_REMINDER',
            }).catch(() => null);
          });
        }
      });
    }

    prevReceivedIdsRef.current = currentIds;
  }, [receivedList?.data]);

  // In-app alert: Monitor sent requests that become accepted (for male users)
  useEffect(() => {
    const list = sentList?.data;
    if (!Array.isArray(list)) return;

    const isAccepted = (s?: string) => {
      const status = String(s || '').trim().toUpperCase();
      return status === 'ACCEPTED' || status === 'APPROVED';
    };

    const acceptedRequests = list.filter((r: any) => isAccepted(r.status));
    const currentIds = new Set(acceptedRequests.map((r: any) => String(r.id)));

    if (prevAcceptedIdsRef.current === null) {
      prevAcceptedIdsRef.current = currentIds;
      return;
    }

    const newlyAccepted = acceptedRequests.filter(
      (r: any) => !prevAcceptedIdsRef.current!.has(String(r.id))
    );

    if (newlyAccepted.length > 0) {
      newlyAccepted.forEach((item: any) => {
        const receiver = item.receiver || {};
        const receiverName = receiver.displayName || receiver.name || 'Your match';
        Toast.show({
          type: 'success',
          text1: '🎉 Proposal Accepted!',
          text2: `${receiverName} accepted your invitation! Tap to view.`,
          visibilityTime: 6000,
          onPress: () => {
            Toast.hide();
            navigate('BottomTabs', {
              screen: 'Sent',
              params: { initialTab: 'accepted' },
            });
          },
        });

        if (userId) {
          mockStore.addNotification(
            String(userId),
            '🎉 Proposal Accepted!',
            `${receiverName} accepted your invitation! You can now chat.`,
            'MATCH'
          ).catch(() => null);

          AsyncStorage.getItem('userEmail').then((storedEmail) => {
            const targetEmail = storedEmail || `${userId}@amara.com`;
            mockStore.sendMockEmail({
              userId: String(userId),
              toEmail: targetEmail,
              subject: `It's a Match! ${receiverName} accepted your request on Amara 🎉`,
              body: `Hi,\n\nGreat news! ${receiverName} accepted your connection request on Amara.\n\nYou can now connect directly via Telegram.\n\nBest regards,\nThe Amara Team`,
              type: 'PENDING_INVITE_REMINDER',
            }).catch(() => null);
          });
        }
      });
    }

    prevAcceptedIdsRef.current = currentIds;
  }, [sentList?.data]);

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
