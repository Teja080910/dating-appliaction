import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';

export interface ConnectionRequest {
  id: number | string;
  sender: any;
  receiver: any;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  accessExpired?: boolean;
}

const resolveConnectionArray = (payload: unknown): any[] => {
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
    if (Array.isArray(record.connections)) {
      return record.connections as any[];
    }
  }

  return [];
};

const normalizeConnections = (payload: unknown): ConnectionRequest[] =>
  resolveConnectionArray(payload).map((item) => {
    const rawSender = item?.sender && typeof item.sender === 'object' ? item.sender : {};
    const rawReceiver = item?.receiver && typeof item.receiver === 'object' ? item.receiver : {};

    const sender = item?.sender || {
      id: item?.senderId ?? '0',
      userId: item?.senderId ?? '0',
      displayName: item?.senderName || item?.senderDisplayName || rawSender?.displayName || rawSender?.name,
      photos: item?.senderPhoto ? [item.senderPhoto] : item?.senderPhotos || rawSender?.photos,
      telegramUsername: item?.senderTelegram || item?.senderTelegramUsername || rawSender?.telegramUsername,
    };

    const receiver = item?.receiver || {
      id: item?.receiverId ?? '0',
      userId: item?.receiverId ?? '0',
      displayName: item?.receiverName || item?.receiverDisplayName || rawReceiver?.displayName || rawReceiver?.name,
      photos: item?.receiverPhoto ? [item.receiverPhoto] : item?.receiverPhotos || rawReceiver?.photos,
      telegramUsername: item?.receiverTelegram || item?.receiverTelegramUsername || rawReceiver?.telegramUsername,
    };

    const rawStatus = String(item?.status || 'PENDING').trim().toUpperCase();
    const status = rawStatus === 'APPROVED' ? 'ACCEPTED' : rawStatus;

    return {
      id: item?.id ?? item?.requestId ?? '0',
      sender,
      receiver,
      status,
      createdAt: item?.createdAt ? String(item.createdAt) : null,
      updatedAt: item?.updatedAt ? String(item.updatedAt) : null,
      accessExpired: typeof item?.accessExpired === 'boolean' ? item.accessExpired : false,
    };
  });

const getConnectionErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  fallback;

export const useConnection = (userId?: string | number) => {
  const queryClient = useQueryClient();

  const resolveBackendUserId = async () => {
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId();
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    throw new Error('Unable to resolve backend userId for connections.');
  };

  const resolveActionUserId = async (): Promise<string | number> => {
    try {
      const rawData = (await AsyncStorage.getItem('userData')) || (await AsyncStorage.getItem('user'));
      if (rawData) {
        const parsed = JSON.parse(rawData);
        const id = parsed?.id || parsed?.user?.id || parsed?.data?.id || parsed?.data?.user?.id;
        if (id && Number(id) > 0) return Number(id);
      }
    } catch {}

    try {
      const uid = await resolveBackendUserId();
      const num = Number(uid);
      if (Number.isFinite(num) && num > 0) return num;
      return uid;
    } catch {
      return 0;
    }
  };
  const connectionListKey = ['connections'];
  const sentListKey = ['connections-sent'];
  const receivedListKey = ['connections-received'];

  const refreshQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: connectionListKey });
    await queryClient.invalidateQueries({ queryKey: sentListKey });
    await queryClient.invalidateQueries({ queryKey: receivedListKey });
  };

  const send = useMutation({
    mutationFn: async (
      input:
        | number
        | string
        | {
            receiverId: number | string;
            senderId?: number | string | null;
          },
    ) => {
      const receiverId =
        typeof input === 'object' && input !== null ? input.receiverId : input;
      const senderId =
        typeof input === 'object' && input !== null ? input.senderId : undefined;
      const resolvedSenderId = senderId
        ? toApiUserId(senderId)
        : await resolveBackendUserId();
      const targetReceiverId = toApiUserId(receiverId);

      const payload = {
        senderId: resolvedSenderId,
        receiverId: targetReceiverId,
        byUserId: resolvedSenderId,
        targetUserId: targetReceiverId,
      };

      const res = await apiClient.post('/connections/send', payload, {
        params: {
          senderId: resolvedSenderId,
          receiverId: targetReceiverId,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshQueries();
    },
  });

  const accept = useMutation({
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const numRequestId = Number(requestId) && Number(requestId) > 0 ? Number(requestId) : requestId;

      const payload = {
        requestId: numRequestId,
        userId: resolvedUserId,
      };

      try {
        const res = await apiClient.put('/connections/accept', payload, {
          params: payload,
        });
        return res.data;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        const errorMsg = String(err?.response?.data?.message || err?.message || '').toLowerCase();

        // 409 CONFLICT: Request was already approved / no longer pending
        if (status === 409 || errorMsg.includes('only pending') || errorMsg.includes('already approved')) {
          console.log('[useConnection] Request is already approved (409 Conflict handled as success):', errorMsg);
          return {
            status: 'success',
            message: 'Connection approved',
            data: { id: numRequestId, status: 'ACCEPTED' },
          };
        }

        // Try body-only (in case query params caused issue)
        try {
          const res = await apiClient.put('/connections/accept', payload);
          return res.data;
        } catch (bodyErr: any) {
          const bStatus = Number(bodyErr?.response?.status || 0);
          const bMsg = String(bodyErr?.response?.data?.message || bodyErr?.message || '').toLowerCase();
          if (bStatus === 409 || bMsg.includes('only pending') || bMsg.includes('already approved')) {
            return {
              status: 'success',
              message: 'Connection approved',
              data: { id: numRequestId, status: 'ACCEPTED' },
            };
          }
          throw bodyErr;
        }
      }
    },
    onSuccess: async (_data, requestId) => {
      const targetId = String(requestId);
      queryClient.setQueryData(receivedListKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'ACCEPTED' } : item
        );
      });
      queryClient.setQueryData(sentListKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'ACCEPTED' } : item
        );
      });
      await refreshQueries();
    },
  });

  const reject = useMutation({
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const numRequestId = Number(requestId) && Number(requestId) > 0 ? Number(requestId) : requestId;

      const payload = {
        requestId: numRequestId,
        userId: resolvedUserId,
      };

      try {
        const res = await apiClient.put('/connections/decline', payload, { params: payload });
        return res.data;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        const errorMsg = String(err?.response?.data?.message || err?.message || '').toLowerCase();
        if (status === 409 || errorMsg.includes('already')) {
          return { status: 'success', message: 'Invitation declined', data: { id: numRequestId, status: 'DECLINED' } };
        }

        const res = await apiClient
          .put('/connections/decline', payload)
          .catch(() => apiClient.put('/connections/reject', payload, { params: payload }))
          .catch(() => apiClient.put('/connections/reject', payload));
        return res.data;
      }
    },
    onSuccess: async (_data, requestId) => {
      const targetId = String(requestId);
      queryClient.setQueryData(receivedListKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'DECLINED' } : item
        );
      });
      await refreshQueries();
    },
  });

  const cancel = useMutation({
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const numRequestId = Number(requestId) && Number(requestId) > 0 ? Number(requestId) : requestId;

      const payload = {
        requestId: numRequestId,
        userId: resolvedUserId,
      };

      try {
        const res = await apiClient.put('/connections/cancel', payload, { params: payload });
        return res.data;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        const errorMsg = String(err?.response?.data?.message || err?.message || '').toLowerCase();
        if (status === 409 || errorMsg.includes('already')) {
          return { status: 'success', message: 'Invitation cancelled', data: { id: numRequestId, status: 'CANCELLED' } };
        }
        const res = await apiClient.put('/connections/cancel', payload);
        return res.data;
      }
    },
    onSuccess: async (_data, requestId) => {
      const targetId = String(requestId);
      queryClient.setQueryData(sentListKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'CANCELLED' } : item
        );
      });
      await refreshQueries();
    },
  });

  const connectionList = useQuery({
    queryKey: connectionListKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get('/connections/list', {
        params: { userId: resolvedUserId, targetUserId: resolvedUserId },
      });
      return normalizeConnections(res.data);
    },
    retry: false,
  });

  const sentList = useQuery({
    queryKey: sentListKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get('/connections/sent', {
        params: { userId: resolvedUserId, senderId: resolvedUserId },
      });
      return normalizeConnections(res.data);
    },
    retry: false,
  });

  const receivedList = useQuery({
    queryKey: receivedListKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get('/connections/received', {
        params: { userId: resolvedUserId, receiverId: resolvedUserId },
      });
      return normalizeConnections(res.data);
    },
    retry: false,
  });

  const connectionStatus = useMutation({
    mutationFn: async ({ user1, user2 }: { user1: number | string; user2: number | string }) => {
      const u1 = toApiUserId(user1);
      const u2 = toApiUserId(user2);
      const res = await apiClient.get('/connections/status', {
        params: {
          senderId: u1,
          receiverId: u2,
          user1: u1,
          user2: u2,
        },
      });
      return res.data;
    },
  });

  const refreshAll = () => {
    connectionList.refetch();
    sentList.refetch();
    receivedList.refetch();
  };

  return {
    send,
    accept,
    reject,
    decline: reject,
    cancel,
    connectionList,
    sentList,
    receivedList,
    connectionStatus,
    refreshAll,
    getConnectionErrorMessage,
  };
};
