import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

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

export const useTelegram = () => {
  const queryClient = useQueryClient();
  const profileQueryKeys = ['myProfile', 'profile-me', 'telegram-link'];
  const resolveBackendUserId = async (candidate?: string | number) => {
    const resolvedUserId = String(candidate ?? '').trim() || await getUserId();
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return resolvedUserId;
  };

  const getTelegramLink = useMutation({
    mutationFn: async (variables?: { userId?: string | number }) => {
      const resolvedUserId = await resolveBackendUserId(variables?.userId);
      const res = await apiClient.get('/telegram/link', {
        params: { userId: resolvedUserId },
      });
      return normalizeTelegramResponse(res.data);
    },
    onError: (err: any) => {
      console.error('Telegram Link Error:', err?.response?.data || err.message);
    },
  });

  // ✅ Connect Telegram
  const connectTelegram = useMutation({
    mutationFn: async ({ userId, username }: { userId: string | number; username?: string }) => {
      const resolvedUserId = await resolveBackendUserId(userId);
      // Endpoint usually initiates connection or maps username
      const res = await apiClient.post('/telegram/connect', null, {
        params: {
          userId: resolvedUserId,
          username: String(username || '').trim() || 'pending',
        },
      });
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
      const resolvedUserId = await resolveBackendUserId(variables?.userId);
      const res = await apiClient.delete('/telegram/disconnect', {
        params: { userId: resolvedUserId },
      });
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
