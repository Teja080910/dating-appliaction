import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';

export interface ConnectionRequest {
  id: number;
  sender: any;
  receiver: any;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
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
  resolveConnectionArray(payload).map((item) => ({
    id: typeof item?.id === 'number' ? item.id : 0,
    sender: item?.sender || null,
    receiver: item?.receiver || null,
    status: String(item?.status || 'PENDING').trim().toUpperCase(),
    createdAt: item?.createdAt ? String(item.createdAt) : null,
    updatedAt: item?.updatedAt ? String(item.updatedAt) : null,
  }));

const getConnectionErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  fallback;

export const useConnection = (userId?: string | number) => {
  const queryClient = useQueryClient();

  const resolveBackendUserId = async () => {
    if (userId) return String(userId);
    const stored = await getUserId();
    if (!stored) throw new Error('Unable to resolve backend userId for connections.');
    return stored;
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

      const res = await apiClient.post('/connections/send', {
        senderId: resolvedSenderId,
        receiverId: toApiUserId(receiverId),
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshQueries();
    },
  });

  const accept = useMutation({
    mutationFn: async (requestId: number) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/connections/accept', {
        requestId: Number(requestId),
        userId: resolvedUserId,
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshQueries();
    },
  });

  const decline = useMutation({
    mutationFn: async (requestId: number) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/connections/decline', {
        requestId: Number(requestId),
        userId: resolvedUserId,
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshQueries();
    },
  });

  const cancel = useMutation({
    mutationFn: async (requestId: number) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/connections/cancel', {
        requestId: Number(requestId),
        userId: resolvedUserId,
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshQueries();
    },
  });

  const connectionList = useQuery({
    queryKey: connectionListKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get('/connections/list', {
        params: { userId: resolvedUserId },
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
        params: { userId: resolvedUserId },
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
        params: { userId: resolvedUserId },
      });
      return normalizeConnections(res.data);
    },
    retry: false,
  });

  const connectionStatus = useMutation({
    mutationFn: async ({ user1, user2 }: { user1: number | string; user2: number | string }) => {
      const res = await apiClient.get('/connections/status', {
        params: {
          user1: toApiUserId(user1),
          user2: toApiUserId(user2),
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
    decline,
    cancel,
    connectionList,
    sentList,
    receivedList,
    connectionStatus,
    refreshAll,
    getConnectionErrorMessage,
  };
};
