import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';
import { normalizeConnections } from './useConnection';
import { t } from '../i18n';

export interface NotificationItem {
  id: number | string;
  type?: string;
  title: string;
  body: string;
  message: string;
  read: boolean;
  createdAt: string | null;
  raw: any;
}

export interface EmailLogItem {
  id?: string | number;
  recipient?: string;
  subject?: string;
  body?: string;
  sentAt?: string | null;
  status?: string;
}

const resolveNotificationArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as any[];
    }
    if (Array.isArray(record.content)) {
      return record.content as any[];
    }
    if (Array.isArray(record.notifications)) {
      return record.notifications as any[];
    }
  }

  return [];
};

const normalizeNotifications = (payload: unknown): NotificationItem[] =>
  resolveNotificationArray(payload).map((item) => {
    const user =
      item?.user && typeof item.user === 'object'
        ? { ...item.user }
        : undefined;
    if (user) {
      delete user.mobile;
      delete user.password;
    }
    return {
      id: item?.id != null ? item.id : 0,
      title: String(item?.title || item?.subject || t('profile.notificationsscreen.notification')).trim(),
      body: String(item?.body || item?.message || '').trim(),
      message: String(item?.message || item?.body || '').trim(),
      read: Boolean(item?.read ?? item?.isRead ?? false),
      createdAt: item?.createdAt ? String(item.createdAt) : null,
      raw: item,
    };
  });

const getNotificationErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  fallback;

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications?: boolean;
}

export const useNotification = (userId?: string | number) => {
  const queryClient = useQueryClient();

  const resolveBackendUserId = async () => {
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId().catch(() => null);
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    if (userId) return String(userId);
    throw new Error('Unable to resolve backend userId for notifications.');
  };

  const queryKey = ['notifications', userId ? String(userId) : 'current'];
  const prefQueryKey = ['notification-preferences', userId ? String(userId) : 'current'];

  const useNotificationList = () =>
    useQuery({
      queryKey,
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        let backendNotifs: NotificationItem[] = [];
        try {
          const response = await apiClient.get('/notification', {
            params: { userId: toApiUserId(resolvedUserId) },
          });
          backendNotifs = normalizeNotifications(response.data);
        } catch {}

        const synthesized: NotificationItem[] = [];

        // 1. Fetch sent connections for accepted proposals
        try {
          const sentRes = await apiClient.get('/connections/sent', {
            params: { userId: resolvedUserId, senderId: resolvedUserId },
          });
          const sentItems = normalizeConnections(sentRes.data);
          for (const item of sentItems) {
            const isAccepted = item.status === 'ACCEPTED' || item.status === 'APPROVED';
            if (isAccepted) {
              const name = item.receiver?.displayName || item.receiver?.name || 'Your match';
              synthesized.push({
                id: `match_${item.id}`,
                type: 'MATCH',
                title: t('profile.notificationsscreen.proposal_accepted', { defaultValue: 'Proposal Accepted!' }),
                body: t('profile.notificationsscreen.proposal_accepted_body', {
                  name,
                  defaultValue: `${name} accepted your date proposal! You can now chat on WhatsApp or Telegram.`,
                }),
                message: `${name} accepted your date proposal! You can now chat on WhatsApp or Telegram.`,
                read: false,
                createdAt: item.updatedAt || item.createdAt || new Date().toISOString(),
                raw: { ...item, type: 'MATCH' },
              });
            }
          }
        } catch {}

        // 2. Fetch /connections/list for mutual connections
        try {
          const listRes = await apiClient.get('/connections/list', {
            params: { userId: resolvedUserId, targetUserId: resolvedUserId },
          });
          const listItems = normalizeConnections(listRes.data);
          for (const item of listItems) {
            const idKey = `match_${item.id}`;
            if (!synthesized.some((s) => s.id === idKey)) {
              const partner = String(item.sender?.userId) === String(resolvedUserId) ? item.receiver : item.sender;
              const name = partner?.displayName || partner?.name || 'Your match';
              synthesized.push({
                id: idKey,
                type: 'MATCH',
                title: 'Connected!',
                body: `You are connected with ${name}! You can now chat on WhatsApp or Telegram.`,
                message: `You are connected with ${name}! You can now chat on WhatsApp or Telegram.`,
                read: false,
                createdAt: item.updatedAt || item.createdAt || new Date().toISOString(),
                raw: { ...item, type: 'MATCH' },
              });
            }
          }
        } catch {}

        // 3. Fetch received connections for incoming proposals
        try {
          const receivedRes = await apiClient.get('/connections/received', {
            params: { userId: resolvedUserId, receiverId: resolvedUserId },
          });
          const receivedItems = normalizeConnections(receivedRes.data);
          for (const item of receivedItems) {
            const isPending = item.status === 'PENDING';
            if (isPending) {
              const name = item.sender?.displayName || item.sender?.name || 'Someone';
              synthesized.push({
                id: `invite_${item.id}`,
                type: 'INVITATION',
                title: 'New Date Proposal!',
                body: `${name} sent you a date proposal. Tap to view and respond.`,
                message: `${name} sent you a date proposal. Tap to view and respond.`,
                read: false,
                createdAt: item.createdAt || new Date().toISOString(),
                raw: { ...item, type: 'INVITATION' },
              });
            }
          }
        } catch {}

        // 4. Load persisted read status from AsyncStorage
        let readIds = new Set<string>();
        try {
          const raw = await AsyncStorage.getItem(`@amara_read_notifs_${resolvedUserId}`);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) readIds = new Set(arr.map(String));
          }
        } catch {}

        // 5. Combine and deduplicate
        const all = [...backendNotifs, ...synthesized];
        const seen = new Set<string>();
        const result: NotificationItem[] = [];
        for (const notif of all) {
          const sId = String(notif.id);
          if (!seen.has(sId)) {
            seen.add(sId);
            result.push({
              ...notif,
              read: readIds.has(sId) || notif.read,
            });
          }
        }

        // Sort latest first
        result.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        return result;
      },
      refetchInterval: 6000,
    });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number | string) => {
      let resolvedUserId: string | null = null;
      try {
        resolvedUserId = await resolveBackendUserId();
      } catch (_) {}

      const sId = String(notificationId);
      if (resolvedUserId) {
        try {
          const storageKey = `@amara_read_notifs_${resolvedUserId}`;
          const raw = await AsyncStorage.getItem(storageKey);
          const current: string[] = raw ? JSON.parse(raw) : [];
          if (!current.includes(sId)) {
            current.push(sId);
            await AsyncStorage.setItem(storageKey, JSON.stringify(current));
          }
        } catch {}
      }

      if (!sId.startsWith('match_') && !sId.startsWith('invite_')) {
        try {
          await apiClient.put(
            `/notification/read/${notificationId}`,
            null,
            {
              params: {
                notificationId,
                ...(resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : {}),
              },
            },
          );
        } catch {}
      }
      return { success: true };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const usePreferences = () =>
    useQuery({
      queryKey: prefQueryKey,
      queryFn: async () => {
        let resolvedUserId: string | null = null;
        try {
          resolvedUserId = await resolveBackendUserId();
        } catch (_) {}

        const response = await apiClient.get('/notification/preferences', {
          params: resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : undefined,
        });
        return response.data as NotificationPreferences;
      },
    });

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      let resolvedUserId: string | null = null;
      try {
        resolvedUserId = await resolveBackendUserId();
      } catch (_) {}

      const payload = {
        ...prefs,
        ...(resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : {}),
      };

      const response = await apiClient.put('/notification/preferences', payload, {
        params: resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : undefined,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const pushNotification = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const response = await apiClient.post('/notification/push', payload);
      return response.data;
    },
  });

  const emailsQueryKey = ['emails', 'my', userId ? String(userId) : 'current'];

  const useMyEmails = () =>
    useQuery({
      queryKey: emailsQueryKey,
      queryFn: async () => {
        let resolvedUserId = '';
        try {
          resolvedUserId = await resolveBackendUserId();
        } catch (_) {}

        let response;
        try {
          response = await apiClient.get('/emails/my', {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          });
        } catch (err: any) {
          if (err?.response?.status === 403 || err?.response?.data?.code === 'ACCESS_DENIED') {
            response = await apiClient.get('/emails/my');
          } else {
            throw err;
          }
        }

        const data = response?.data;
        if (Array.isArray(data)) return data as EmailLogItem[];
        if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
          return (data as any).data as EmailLogItem[];
        }
        return [];
      },
    });

  return {
    useNotificationList,
    markRead: markReadMutation,
    usePreferences,
    updatePreferences,
    pushNotification,
    useMyEmails,
    useEmails: useMyEmails,
    getNotificationErrorMessage,
    notificationList: useNotificationList,
    notificationVisit: markReadMutation,
  };
};
