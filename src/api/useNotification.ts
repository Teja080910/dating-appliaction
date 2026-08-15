import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  message: string;
  read: boolean;
  createdAt: string | null;
  raw: any;
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
      title: String(item?.title || item?.subject || 'Notification').trim(),
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

export const useNotification = (userId?: string) => {
  const queryClient = useQueryClient();
  void userId;
  const queryKey = ['notifications'];

  const useNotificationList = () =>
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await apiClient.get('/notification');

        return normalizeNotifications(response.data);
      },
    });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.put(`/notification/read/${notificationId}`);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const pushNotification = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const response = await apiClient.post('/notification/push', payload);
      return response.data;
    },
  });

  return {
    useNotificationList,
    markRead: markReadMutation,
    pushNotification,
    getNotificationErrorMessage,
    notificationList: useNotificationList,
    notificationVisit: markReadMutation,
  };
};
