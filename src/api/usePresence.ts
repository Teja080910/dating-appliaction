import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

const HEARTBEAT_MS = 60_000;

/** Keeps the authenticated user's online state in sync with the app lifecycle. */
export const usePresence = () => {
  const requestInFlight = useRef(false);

  useEffect(() => {
    let mounted = true;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const updateStatus = async (status: 'online' | 'offline') => {
      if (!mounted || requestInFlight.current) return;
      requestInFlight.current = true;
      try {
        const userId = await getUserId();
        if (!userId || !mounted) return;
        await apiClient.put(`/status/${status}`, null, { params: { userId } });
      } catch (error) {
        if (__DEV__) console.warn(`[Presence] Could not set ${status} status`, error);
      } finally {
        requestInFlight.current = false;
      }
    };

    const startPresence = () => {
      void updateStatus('online');
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = setInterval(() => void updateStatus('online'), HEARTBEAT_MS);
    };

    const stopPresence = () => {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      void updateStatus('offline');
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') startPresence();
      if (nextState === 'background' || nextState === 'inactive') stopPresence();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    if (AppState.currentState === 'active') startPresence();

    return () => {
      mounted = false;
      subscription.remove();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, []);
};

