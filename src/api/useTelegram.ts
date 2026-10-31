import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';

/**
 * Hook for Telegram Connection
 */
const normalizeTelegramResponse = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const linkCandidate =
      record.link ||
      record.url ||
      record.telegramLink ||
      record.inviteLink ||
      record.data;

    if (typeof linkCandidate === 'string') {
      return linkCandidate.trim();
    }

    return record;
  }

  return '';
};

const resolveBackendTelegramUserId = async (candidate?: string | number) => {
  const trimmed = String(candidate ?? '').trim();
  if (trimmed && isResolvedApiUserId(trimmed)) return trimmed;
  const stored = await getUserId();
  if (stored && isResolvedApiUserId(stored)) return stored;
  const session = await getAuthSession();
  if (session?.userId && isResolvedApiUserId(session.userId)) {
    return String(session.userId);
  }
  if (stored) return stored;
  throw new Error('Unable to resolve backend userId from session.');
};

export const useTelegram = () => {
  const queryClient = useQueryClient();
  const profileQueryKeys = ['myProfile', 'profile-me', 'telegram-link'];

  const getTelegramLink = useMutation({
    mutationFn: async (variables?: { userId?: string | number; targetUserId?: string | number }) => {
      const resolvedUserId = await resolveBackendTelegramUserId(variables?.userId);
      const targetId = variables?.targetUserId ? String(variables.targetUserId).trim() : undefined;
      const res = await apiClient.get('/telegram/link', {
        params: {
          userId: resolvedUserId,
          ...(targetId ? { targetUserId: targetId } : {}),
        },
      });
      return normalizeTelegramResponse(res.data);
    },
    onError: (err: any) => {
      console.error('Telegram Link Error:', err?.response?.data || err.message);
    },
  });

  // ✅ Connect Telegram
  const connectTelegram = useMutation({
    mutationFn: async ({ userId, username }: { userId?: string | number; username?: string }) => {
      const resolvedUserId = await resolveBackendTelegramUserId(userId);
      const normalizedUsername = String(username || '').trim().replace(/^@+/, '');
      if (!normalizedUsername) {
        throw new Error('Telegram username is required.');
      }
      const payload = {
        userId: resolvedUserId,
        username: normalizedUsername,
        telegramUsername: normalizedUsername,
      };

      const res = await apiClient.post('/telegram/connect', payload, {
        params: payload,
      });

      // Cache locally
      await AsyncStorage.setItem('@telegram_username', normalizedUsername);
      return normalizeTelegramResponse(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-link'] });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    },
    onError: (err: any) => {
      console.error('Telegram Connect Error:', err?.response?.data || err.message);
    },
  });

  const disconnectTelegram = useMutation({
    mutationFn: async (variables?: { userId?: string | number }) => {
      const resolvedUserId = await resolveBackendTelegramUserId(variables?.userId);
      const payload = { userId: resolvedUserId };
      const res = await apiClient.delete('/telegram/disconnect', {
        params: payload,
        data: payload,
      });
      await AsyncStorage.removeItem('@telegram_username');
      return normalizeTelegramResponse(res.data);
    },
    onSuccess: () => {
      for (const key of profileQueryKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (err: any) => {
      console.error('Telegram Disconnect Error:', err?.response?.data || err.message);
    },
  });

  return {
    connectTelegram,
    getTelegramLink,
    disconnectTelegram,
  };
};

export const useTargetTelegramLink = (targetUserId?: string | number | null) => {
  return useQuery({
    queryKey: ['telegram-link', targetUserId ? String(targetUserId) : 'me'],
    queryFn: async () => {
      const resolvedUserId = await resolveBackendTelegramUserId();
      const res = await apiClient.get('/telegram/link', {
        params: {
          userId: resolvedUserId,
          ...(targetUserId ? { targetUserId: String(targetUserId) } : {}),
        },
      });
      return normalizeTelegramResponse(res.data);
    },
    enabled: Boolean(targetUserId !== undefined && targetUserId !== null),
    retry: false,
  });
};
