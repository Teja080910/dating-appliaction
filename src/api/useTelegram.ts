import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DeviceEventEmitter } from 'react-native';
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

      // Synchronize backend profile table
      try {
        await apiClient.put('/profile/update', {
          userId: resolvedUserId,
          telegramUsername: normalizedUsername,
        });
      } catch {}

      // Cache locally and clear disconnected flag
      if (resolvedUserId) {
        await AsyncStorage.setItem(`user_telegram_${resolvedUserId}`, normalizedUsername);
        await AsyncStorage.setItem(`@telegram_username_${resolvedUserId}`, normalizedUsername);
        await AsyncStorage.removeItem(`@amara_telegram_disconnected_${resolvedUserId}`).catch(() => {});
      }
      // Purge legacy global keys so no other user on this device sees this username
      await AsyncStorage.multiRemove(['@telegram_username', 'telegramUsername']).catch(() => {});
      return normalizeTelegramResponse(res.data);
    },
    onSuccess: async (_, variables) => {
      const cleanUser = String(variables?.username || '').trim().replace(/^@+/, '');
      const resolvedUserId = await resolveBackendTelegramUserId(variables?.userId).catch(() => null);

      if (resolvedUserId) {
        queryClient.setQueryData(['my-telegram-status', resolvedUserId], {
          telegramUsername: cleanUser,
          telegramLink: `https://t.me/${cleanUser}`,
          isConnected: Boolean(cleanUser),
        });
      }
      queryClient.setQueryData(['my-telegram-status', 'current'], {
        telegramUsername: cleanUser,
        telegramLink: `https://t.me/${cleanUser}`,
        isConnected: Boolean(cleanUser),
      });

      queryClient.invalidateQueries({ queryKey: ['my-telegram-status'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-link'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
    },
    onError: (err: any) => {
      console.error('Telegram Connect Error:', err?.response?.data || err.message);
    },
  });

  const disconnectTelegram = useMutation({
    mutationFn: async (variables?: { userId?: string | number }) => {
      const resolvedUserId = await resolveBackendTelegramUserId(variables?.userId);
      const payload = { userId: resolvedUserId };

      // 1. Call backend DELETE /telegram/disconnect
      let resData: any = null;
      try {
        const res = await apiClient.delete('/telegram/disconnect', {
          params: payload,
          data: payload,
        });
        resData = res?.data;
      } catch (err) {
        console.warn('[Telegram] DELETE /telegram/disconnect error:', err);
      }

      // 2. Clear backend profile telegramUsername to "NONE" (backend rejects empty string with 400)
      try {
        await apiClient.put('/profile/update', {
          userId: resolvedUserId,
          telegramUsername: 'NONE',
        });
      } catch {}

      // 3. Clear local storage markers and set disconnected flag
      if (resolvedUserId) {
        await AsyncStorage.multiRemove([
          `user_telegram_${resolvedUserId}`,
          `@telegram_username_${resolvedUserId}`,
          `@amara_telegram_disconnected_${resolvedUserId}`,
        ]).catch(() => {});
        await AsyncStorage.setItem(`@amara_telegram_disconnected_${resolvedUserId}`, 'true').catch(() => {});
      }

      await AsyncStorage.multiRemove([
        '@telegram_username',
        'telegramUsername',
        'telegramLink',
      ]).catch(() => {});

      return normalizeTelegramResponse(resData || { status: 'success' });
    },
    onSuccess: async (_, variables) => {
      const resolvedUserId = await resolveBackendTelegramUserId(variables?.userId).catch(() => null);

      if (resolvedUserId) {
        queryClient.setQueryData(['my-telegram-status', resolvedUserId], {
          telegramUsername: '',
          telegramLink: '',
          isConnected: false,
        });
      }
      queryClient.setQueryData(['my-telegram-status', 'current'], {
        telegramUsername: '',
        telegramLink: '',
        isConnected: false,
      });

      queryClient.invalidateQueries({ queryKey: ['my-telegram-status'] });
      queryClient.invalidateQueries({ queryKey: ['telegram-link'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
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

export const BOT_NAME_STORAGE_KEY = '@amara_telegram_bot_name';
export const DEFAULT_AMARA_BOT_USERNAME = 'amara_dating_bot';

/**
 * Robust helper to extract a clean bot username from various backend response shapes.
 */
export const extractBotUsername = (payload: unknown): string => {
  if (!payload) return '';
  if (typeof payload === 'string') {
    let trimmed = payload.trim();
    if (trimmed.includes('t.me/')) {
      const match = trimmed.match(/t\.me\/([^/?#]+)/i);
      if (match && match[1]) {
        return match[1].replace(/^@+/, '');
      }
    }
    trimmed = trimmed.replace(/^@+/, '');
    if (trimmed && !trimmed.includes(' ') && !trimmed.includes('{')) {
      return trimmed;
    }
  }

  if (typeof payload === 'object') {
    const rec = payload as Record<string, any>;
    const cand =
      rec.botName ||
      rec.bot_name ||
      rec.botUsername ||
      rec.bot_username ||
      rec.telegramBot ||
      rec.telegram_bot ||
      rec.telegramBotName ||
      rec.telegram_bot_name ||
      rec.username ||
      rec.bot ||
      rec.name ||
      rec.link ||
      rec.url ||
      (typeof rec.data === 'string' ? rec.data : null) ||
      rec.data?.botName ||
      rec.data?.bot_name ||
      rec.data?.botUsername ||
      rec.data?.bot_username ||
      rec.data?.username ||
      rec.data?.bot ||
      rec.data?.name;
    if (typeof cand === 'string') {
      let clean = cand.trim();
      if (clean.includes('t.me/')) {
        const match = clean.match(/t\.me\/([^/?#]+)/i);
        if (match && match[1]) {
          return match[1].replace(/^@+/, '');
        }
      }
      clean = clean.replace(/^@+/, '');
      if (clean && !clean.includes(' ') && !clean.includes('{')) {
        return clean;
      }
    }
  }

  return '';
};

/**
 * Fetch the Amara Telegram Bot Name dynamically from the backend,
 * with multi-endpoint fallback, obsolete cache purging, and local AsyncStorage caching.
 */
export const fetchAmaraBotName = async (): Promise<string> => {
  const candidateEndpoints = [
    '/telegram/bot-name',
    '/telegram/botName',
    '/telegram/bot_name',
    '/telegram/bot',
    '/telegram/botname',
    '/telegram/name',
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await apiClient.get(endpoint);
      if (__DEV__) {
        console.log(`🤖 [TelegramBot] Response from ${endpoint}:`, res?.data);
      }
      const extracted = extractBotUsername(res?.data);
      if (extracted) {
        // If backend returned the obsolete AmaraofficialBot, override with current active bot
        if (extracted.toLowerCase().includes('amaraofficialbot')) {
          console.warn(`🤖 [TelegramBot] Received obsolete bot name '${extracted}'. Overriding with '${DEFAULT_AMARA_BOT_USERNAME}'.`);
          await AsyncStorage.setItem(BOT_NAME_STORAGE_KEY, DEFAULT_AMARA_BOT_USERNAME).catch(() => {});
          return DEFAULT_AMARA_BOT_USERNAME;
        }

        await AsyncStorage.setItem(BOT_NAME_STORAGE_KEY, extracted).catch(() => {});
        return extracted;
      }
    } catch (err: any) {
      if (__DEV__) {
        console.log(`🤖 [TelegramBot] ${endpoint} returned error:`, err?.response?.status || err?.message || err);
      }
    }
  }

  // Fallback to cached value (purging obsolete AmaraofficialBot if present)
  try {
    const cached = await AsyncStorage.getItem(BOT_NAME_STORAGE_KEY);
    if (cached && cached.trim()) {
      const cleanCached = cached.trim().replace(/^@+/, '');
      if (cleanCached.toLowerCase().includes('amaraofficialbot')) {
        await AsyncStorage.removeItem(BOT_NAME_STORAGE_KEY).catch(() => {});
      } else {
        return cleanCached;
      }
    }
  } catch {}

  return DEFAULT_AMARA_BOT_USERNAME;
};

/**
 * Fetch personalized Telegram Bot deep-link with start token from backend:
 * POST /telegram/bot-link?userId=...
 * Example response: {"status":"success","link":"https://t.me/AmaraofficialBot?start=3205e528bcdb4f83ad44adefca1eae57"}
 */
export const fetchAmaraBotLink = async (userIdCandidate?: string | number): Promise<string> => {
  try {
    const resolvedUserId = await resolveBackendTelegramUserId(userIdCandidate);
    const res = await apiClient.post('/telegram/bot-link', null, {
      params: { userId: resolvedUserId },
    });
    const link =
      res?.data?.link ||
      res?.data?.url ||
      res?.data?.telegramLink ||
      (typeof res?.data === 'string' && res.data.includes('t.me/') ? res.data : null);
    if (link && typeof link === 'string') {
      const cleanLink = link.trim();
      const extractedBot = extractBotUsername(cleanLink);
      if (extractedBot) {
        await AsyncStorage.setItem(BOT_NAME_STORAGE_KEY, extractedBot).catch(() => {});
      }
      return cleanLink;
    }
  } catch (err) {
    // If bot-link fails, fallback to general bot-name
  }

  const botName = await fetchAmaraBotName();
  const resolvedUserId = await resolveBackendTelegramUserId(userIdCandidate).catch(() => null);
  const startParam = resolvedUserId ? `?start=USER_${resolvedUserId}` : '';
  return `https://t.me/${botName || DEFAULT_AMARA_BOT_USERNAME}${startParam}`;
};

/**
 * Hook to retrieve the dynamic Telegram Bot Name.
 */
export const useTelegramBotName = () => {
  return useQuery({
    queryKey: ['telegram-bot-name'],
    queryFn: fetchAmaraBotName,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

/**
 * Hook to retrieve current user's Telegram link and status from the backend.
 */
export const useMyTelegramStatus = (userIdCandidate?: string | number | null) => {
  return useQuery({
    queryKey: ['my-telegram-status', userIdCandidate ? String(userIdCandidate) : 'current'],
    queryFn: async () => {
      let resolvedUserId: string | number = '';
      try {
        resolvedUserId = await resolveBackendTelegramUserId(userIdCandidate ?? undefined);
        const isDisconnected = await AsyncStorage.getItem(
          `@amara_telegram_disconnected_${resolvedUserId}`
        ).catch(() => null);
        if (isDisconnected === 'true') {
          return {
            telegramUsername: '',
            telegramLink: '',
            isConnected: false,
          };
        }

        const res = await apiClient.get('/telegram/link', {
          params: { userId: resolvedUserId },
        });
        const raw = res?.data;
        let telegramUsername = '';
        let telegramLink = '';

        if (typeof raw === 'string') {
          if (raw.includes('t.me/')) {
            telegramLink = raw.trim();
            const seg = raw.trim().split('/').pop();
            if (seg && !seg.includes('bot')) {
              telegramUsername = seg.replace(/^@+/, '');
            }
          } else {
            telegramUsername = raw.trim().replace(/^@+/, '');
          }
        } else if (raw && typeof raw === 'object') {
          const rec = raw as Record<string, any>;
          telegramUsername =
            rec.telegramUsername ||
            rec.username ||
            rec.tgUsername ||
            rec.telegram ||
            rec.user?.telegramUsername ||
            '';
          telegramLink =
            rec.telegramLink ||
            rec.link ||
            rec.url ||
            (telegramUsername ? `https://t.me/${telegramUsername}` : '');
        }

        let cleanUsername = String(telegramUsername || '').trim().replace(/^@+/, '');
        const norm = cleanUsername.toUpperCase();
        if (
          !cleanUsername ||
          cleanUsername === '-' ||
          norm === 'NONE' ||
          norm === 'NULL' ||
          norm === 'UNDEFINED' ||
          norm === 'N/A'
        ) {
          cleanUsername = '';
        }

        return {
          telegramUsername: cleanUsername,
          telegramLink: cleanUsername ? (telegramLink || `https://t.me/${cleanUsername}`) : '',
          isConnected: Boolean(cleanUsername),
        };
      } catch {
        const cached = resolvedUserId
          ? await AsyncStorage.getItem(`user_telegram_${resolvedUserId}`).catch(() => null)
          : null;
        let cleanCached = String(cached || '').trim().replace(/^@+/, '');
        const norm = cleanCached.toUpperCase();
        if (
          !cleanCached ||
          cleanCached === '-' ||
          norm === 'NONE' ||
          norm === 'NULL' ||
          norm === 'UNDEFINED' ||
          norm === 'N/A'
        ) {
          cleanCached = '';
        }
        return {
          telegramUsername: cleanCached,
          telegramLink: cleanCached ? `https://t.me/${cleanCached}` : '',
          isConnected: Boolean(cleanCached),
        };
      }
    },
    staleTime: 1000 * 15, // 15 seconds
    retry: 1,
  });
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
