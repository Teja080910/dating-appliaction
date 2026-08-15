import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

/**
 * Hook for Misc Services
 * (Privacy, Notifications, Telegram, Online Status)
 */

const normalizeTelegramPayload = (payload: unknown) => {
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

const normalizePlainResponse = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    return (
      (typeof record.message === 'string' && record.message.trim()) ||
      (typeof record.data === 'string' && record.data.trim()) ||
      record
    );
  }

  return '';
};

const normalizePrivacyStatus = (payload: unknown) => {
  if (typeof payload === 'boolean') {
    return payload;
  }

  if (typeof payload === 'string') {
    return payload.trim().toLowerCase() === 'true';
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.accepted ?? record.status ?? record.data ?? record.value;
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (typeof candidate === 'string') {
      return candidate.trim().toLowerCase() === 'true';
    }
  }

  return false;
};

const normalizePrivacyDetails = (payload: unknown) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const nestedData =
      record.data && typeof record.data === 'object' && !Array.isArray(record.data)
        ? (record.data as Record<string, unknown>)
        : null;

    return {
      ...(record || {}),
      ...(nestedData || {}),
      user:
        nestedData?.user ||
        record.user ||
        null,
      acceptedAt:
        (typeof nestedData?.acceptedAt === 'string' && nestedData.acceptedAt) ||
        (typeof record.acceptedAt === 'string' && record.acceptedAt) ||
        null,
    };
  }

  return null;
};

export const useServices = (userId?: string) => {
  const queryClient = useQueryClient();
  const notificationsQueryKey = ['notifications'];
  const telegramQueryKey = ['telegram-link'];
  const resolveBackendUserId = async () => {
    const resolvedUserId = String(userId || '').trim() || await getUserId();
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return resolvedUserId;
  };

  // =========================
  // 🔐 PRIVACY
  // =========================

  // Accept privacy
  const acceptPrivacy = useMutation({
    mutationFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.post('/privacy/accept', null, {
        params: { userId: resolvedUserId },
      });
      return normalizePlainResponse(res.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['privacy-status'] });
      await queryClient.invalidateQueries({ queryKey: ['privacy-details'] });
    },
  });

  // Privacy status
  const usePrivacyStatus = () =>
    useQuery({
      queryKey: ['privacy-status'],
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        const res = await apiClient.get('/privacy/status', {
          params: { userId: resolvedUserId },
        });
        return normalizePrivacyStatus(res.data);
      },
    });

  // Privacy details
  const usePrivacyDetails = () =>
    useQuery({
      queryKey: ['privacy-details'],
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        const res = await apiClient.get('/privacy/details', {
          params: { userId: resolvedUserId },
        });
        return normalizePrivacyDetails(res.data);
      },
    });

  // =========================
  // 🔔 NOTIFICATIONS
  // =========================

  // Get notifications
  const useNotifications = () =>
    useQuery({
      queryKey: notificationsQueryKey,
      queryFn: async () => {
        const res = await apiClient.get('/notification');
        return normalizeNotifications(res.data);
      },
    });

  // Mark notification read
  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiClient.put(`/notification/read/${notificationId}`);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });

  const pushNotification = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await apiClient.post('/notification/push', payload);
      return res.data;
    },
  });

  // =========================
  // 📩 TELEGRAM
  // =========================

  // Connect telegram
  const connectTelegram = useMutation({
    mutationFn: async (username: string) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.post('/telegram/connect', null, {
        params: {
          userId: resolvedUserId,
          username: String(username || '').trim(),
        },
      });
      return normalizeTelegramPayload(res.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: telegramQueryKey });
    },
  });

  // Get telegram link
  const useTelegramLink = () =>
    useQuery({
      queryKey: telegramQueryKey,
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        const res = await apiClient.get('/telegram/link', {
          params: { userId: resolvedUserId },
        });
        return normalizeTelegramPayload(res.data);
      },
    });

  // Disconnect telegram
  const disconnectTelegram = useMutation({
    mutationFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.delete('/telegram/disconnect', {
        params: { userId: resolvedUserId },
      });
      return normalizeTelegramPayload(res.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: telegramQueryKey });
    },
  });

  // =========================
  // 🟢 ONLINE STATUS
  // =========================

  const setOnline = useMutation({
    mutationFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/status/online', null, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
  });

  const setOffline = useMutation({
    mutationFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/status/offline', null, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
  });

  // =========================
  // EXPORT
  // =========================

  return {
    // Privacy
    acceptPrivacy,
    usePrivacyStatus,
    usePrivacyDetails,

    // Notifications
    useNotifications,
    markNotificationRead,
    pushNotification,

    // Telegram
    connectTelegram,
    useTelegramLink,
    disconnectTelegram,

    // Status
    setOnline,
    setOffline,

    // Aliases (optional)
    astro: connectTelegram,
    weddingPlanner: connectTelegram,
    relationshipCounselor: connectTelegram,
  };
};
  const normalizeNotifications = (payload: unknown) => {
    let list: any[] = [];

    if (Array.isArray(payload)) {
      list = payload;
    } else if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record.data)) {
        list = record.data;
      } else if (Array.isArray(record.content)) {
        list = record.content;
      } else if (Array.isArray(record.notifications)) {
        list = record.notifications;
      }
    }

    return list.map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }
      const copy = { ...item };
      if (copy.user && typeof copy.user === 'object') {
        copy.user = { ...copy.user };
        delete copy.user.mobile;
        delete copy.user.password;
      }
      return copy;
    });
  };
