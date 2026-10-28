import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';
import { t } from '../i18n';

export interface NotificationItem {
  id: number;
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
      id: typeof item?.id === 'number' ? item.id : 0,
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
        const response = await apiClient.get('/notification', {
          params: { userId: toApiUserId(resolvedUserId) },
        });

        return normalizeNotifications(response.data);
      },
    });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      let resolvedUserId: string | null = null;
      try {
        resolvedUserId = await resolveBackendUserId();
      } catch (_) {}

      const response = await apiClient.put(
        `/notification/read/${notificationId}`,
        null,
        {
          params: {
            notificationId,
            ...(resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : {}),
          },
        },
      );
      return response.data;
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

        const response = await apiClient.get('/emails/my', {
          params: resolvedUserId ? { userId: toApiUserId(resolvedUserId) } : undefined,
        });

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
