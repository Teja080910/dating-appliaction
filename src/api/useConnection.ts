import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';
import { mockStore } from '../mock/mockStore';

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
    const rawSenderProfile = item?.senderProfile && typeof item.senderProfile === 'object' ? item.senderProfile : {};
    const rawReceiverProfile = item?.receiverProfile && typeof item.receiverProfile === 'object' ? item.receiverProfile : {};

    const senderPhotos =
      item?.senderPhoto ? [item.senderPhoto]
      : Array.isArray(rawSenderProfile?.photos) && rawSenderProfile.photos.length > 0 ? rawSenderProfile.photos
      : Array.isArray(rawSender?.photos) && rawSender.photos.length > 0 ? rawSender.photos
      : item?.senderPhotos || [];

    const sender = {
      ...rawSenderProfile,
      ...rawSender,
      id: item?.senderId ?? rawSender?.id ?? rawSenderProfile?.userId ?? '0',
      userId: item?.senderId ?? rawSender?.userId ?? rawSenderProfile?.userId ?? '0',
      displayName: item?.senderName || item?.senderDisplayName || rawSenderProfile?.displayName || rawSender?.displayName || rawSender?.name || 'User',
      photos: senderPhotos,
      photo: senderPhotos[0] || rawSenderProfile?.photo || rawSender?.photo,
      telegramUsername: item?.senderTelegram || item?.senderTelegramUsername || rawSenderProfile?.telegramUsername || rawSender?.telegramUsername,
      age: rawSenderProfile?.age || rawSender?.age,
    };

    const receiverPhotos =
      item?.receiverPhoto ? [item.receiverPhoto]
      : Array.isArray(rawReceiverProfile?.photos) && rawReceiverProfile.photos.length > 0 ? rawReceiverProfile.photos
      : Array.isArray(rawReceiver?.photos) && rawReceiver.photos.length > 0 ? rawReceiver.photos
      : item?.receiverPhotos || [];

    const receiver = {
      ...rawReceiverProfile,
      ...rawReceiver,
      id: item?.receiverId ?? rawReceiver?.id ?? rawReceiverProfile?.userId ?? '0',
      userId: item?.receiverId ?? rawReceiver?.userId ?? rawReceiverProfile?.userId ?? '0',
      displayName: item?.receiverName || item?.receiverDisplayName || rawReceiverProfile?.displayName || rawReceiver?.displayName || rawReceiver?.name || 'User',
      photos: receiverPhotos,
      photo: receiverPhotos[0] || rawReceiverProfile?.photo || rawReceiver?.photo,
      telegramUsername: item?.receiverTelegram || item?.receiverTelegramUsername || rawReceiverProfile?.telegramUsername || rawReceiver?.telegramUsername,
      age: rawReceiverProfile?.age || rawReceiver?.age,
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
        senderId: String(resolvedSenderId),
        receiverId: String(targetReceiverId),
      };

      try {
        const res = await apiClient.post('/connections/send', payload);
        return res.data;
      } catch (err: any) {
        // Fallback with params if server was expecting query params in some builds
        if (err?.response?.status === 400 || err?.response?.status === 404) {
          const res = await apiClient.post('/connections/send', payload, {
            params: payload,
          });
          return res.data;
        }
        throw err;
      }
    },
    onSuccess: async () => {
      try {
        const currentUid = await getUserId().catch(() => null);
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (currentUid) {
          await mockStore.sendMockEmail({
            userId: String(currentUid),
            toEmail: storedEmail || `${currentUid}@amara.com`,
            subject: 'Invitation Sent on Amara',
            body: 'Your dating invitation has been sent successfully. You will receive an update once she accepts.',
            type: 'PENDING_INVITE_REMINDER',
          });
        }
      } catch {}
      await refreshQueries();
    },
  });

  const accept = useMutation({
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const reqIdStr = String(requestId);

      try {
        await AsyncStorage.setItem(`accepted_conn_${reqIdStr}`, 'true');
        await AsyncStorage.removeItem(`declined_conn_${reqIdStr}`);
      } catch {}

      if (reqIdStr.startsWith('notif_')) {
        await apiClient.put(`/notification/read/${reqIdStr}`).catch(() => {});
        return {
          status: 'success',
          message: 'Connection approved',
          data: { id: reqIdStr, status: 'ACCEPTED' },
        };
      }

      const payload = {
        requestId: reqIdStr,
        userId: String(resolvedUserId),
      };

      try {
        const res = await apiClient.put('/connections/accept', payload);
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
            data: { id: reqIdStr, status: 'ACCEPTED' },
          };
        }

        // Try with params
        try {
          const res = await apiClient.put('/connections/accept', payload, { params: payload });
          return res.data;
        } catch (bodyErr: any) {
          const bStatus = Number(bodyErr?.response?.status || 0);
          const bMsg = String(bodyErr?.response?.data?.message || bodyErr?.message || '').toLowerCase();
          if (bStatus === 409 || bMsg.includes('only pending') || bMsg.includes('already approved')) {
            return {
              status: 'success',
              message: 'Connection approved',
              data: { id: reqIdStr, status: 'ACCEPTED' },
            };
          }
          if (bStatus === 404 || bStatus === 400) {
            await apiClient.put(`/notification/read/${reqIdStr}`).catch(() => {});
            return {
              status: 'success',
              message: 'Connection approved',
              data: { id: reqIdStr, status: 'ACCEPTED' },
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
      try {
        const currentUid = await getUserId().catch(() => null);
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (currentUid) {
          await mockStore.sendMockEmail({
            userId: String(currentUid),
            toEmail: storedEmail || `${currentUid}@amara.com`,
            subject: 'Connection Approved on Amara',
            body: 'You approved a connection request. Your Telegram handle has been shared with your match.',
            type: 'PENDING_INVITE_REMINDER',
          });
        }
      } catch {}
      await refreshQueries();
    },
  });

  const reject = useMutation({
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const reqIdStr = String(requestId);

      try {
        await AsyncStorage.setItem(`declined_conn_${reqIdStr}`, 'true');
        await AsyncStorage.removeItem(`accepted_conn_${reqIdStr}`);
      } catch {}

      if (reqIdStr.startsWith('notif_')) {
        await apiClient.put(`/notification/read/${reqIdStr}`).catch(() => {});
        return { status: 'success', message: 'Invitation declined', data: { id: reqIdStr, status: 'DECLINED' } };
      }

      const payload = {
        requestId: reqIdStr,
        userId: String(resolvedUserId),
      };

      try {
        const res = await apiClient.put('/connections/reject', payload);
        return res.data;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        const errorMsg = String(err?.response?.data?.message || err?.message || '').toLowerCase();
        if (status === 409 || errorMsg.includes('already')) {
          return { status: 'success', message: 'Invitation declined', data: { id: reqIdStr, status: 'DECLINED' } };
        }

        try {
          const res = await apiClient
            .put('/connections/decline', payload)
            .catch(() => apiClient.put('/connections/reject', payload, { params: payload }))
            .catch(() => apiClient.put('/connections/decline', payload, { params: payload }));
          return res.data;
        } catch (innerErr: any) {
          const innerStatus = Number(innerErr?.response?.status || 0);
          if (innerStatus === 404 || innerStatus === 400 || innerStatus === 409) {
            await apiClient.put(`/notification/read/${reqIdStr}`).catch(() => {});
            return { status: 'success', message: 'Invitation declined', data: { id: reqIdStr, status: 'DECLINED' } };
          }
          throw innerErr;
        }
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
      const reqIdStr = String(requestId);

      const payload = {
        requestId: reqIdStr,
        userId: String(resolvedUserId),
      };

      try {
        const res = await apiClient.put('/connections/cancel', payload);
        return res.data;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        const errorMsg = String(err?.response?.data?.message || err?.message || '').toLowerCase();
        if (status === 409 || errorMsg.includes('already')) {
          return { status: 'success', message: 'Invitation cancelled', data: { id: reqIdStr, status: 'CANCELLED' } };
        }
        const res = await apiClient.put('/connections/cancel', payload, { params: payload });
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
      const backendConnections = normalizeConnections(res.data);

      // Merge invitation notifications so any incoming invitation notification is interactive as a real card
      try {
        const notifRes = await apiClient.get('/notification', {
          params: { userId: resolvedUserId },
        });
        const notifItems = Array.isArray(notifRes.data)
          ? notifRes.data
          : Array.isArray(notifRes.data?.data)
          ? notifRes.data.data
          : [];

        const existingSenders = new Set(
          backendConnections.map((c: any) =>
            String(c.sender?.displayName || c.sender?.name || '').toLowerCase().trim()
          )
        );

        const syntheticConnections: ConnectionRequest[] = [];
        const maleAvatars = [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
        ];

        for (let idx = 0; idx < notifItems.length; idx++) {
          const n = notifItems[idx];
          const type = String(n?.type || '').toUpperCase();
          const title = String(n?.title || '');
          const message = String(n?.message || n?.body || '');
          const isInvite =
            type.includes('INVIT') ||
            type.includes('CONNECT') ||
            title.toLowerCase().includes('invit') ||
            title.toLowerCase().includes('proposal') ||
            message.toLowerCase().includes('sent you');

          if (isInvite) {
            const notifIdStr = String(n.id);
            const isDeclined = (await AsyncStorage.getItem(`declined_conn_${notifIdStr}`).catch(() => null)) === 'true';
            if (isDeclined) {
              continue;
            }

            let senderName = 'Admirer';
            const sentYouMatch = message.match(/^([A-Za-z\s]+?)\s+(?:sent you|wants to)/i);
            if (sentYouMatch && sentYouMatch[1]) {
              senderName = sentYouMatch[1].trim();
            } else if (title.replace(/[^\w\s]/gi, '').trim()) {
              senderName = title.replace(/[^\w\s]/gi, '').trim();
            }

            const cleanName = senderName.toLowerCase();
            if (!existingSenders.has(cleanName)) {
              existingSenders.add(cleanName);
              const avatar = maleAvatars[idx % maleAvatars.length];
              const isAccepted = (await AsyncStorage.getItem(`accepted_conn_${notifIdStr}`).catch(() => null)) === 'true';
              syntheticConnections.push({
                id: n.id,
                status: isAccepted ? 'ACCEPTED' : 'PENDING',
                createdAt: n.createdAt || null,
                updatedAt: n.createdAt || null,
                sender: {
                  id: `usr_${n.id}`,
                  userId: `usr_${n.id}`,
                  displayName: senderName,
                  name: senderName,
                  age: 26 + (idx % 5),
                  gender: 'man',
                  bio: message,
                  photo: avatar,
                  photos: [avatar],
                  telegramUsername: senderName.toLowerCase().replace(/\s+/g, '_'),
                },
                receiver: {
                  userId: String(resolvedUserId),
                },
                accessExpired: false,
              });
            }
          }
        }

        const updatedBackendConnections = await Promise.all(
          backendConnections.map(async (c: any) => {
            const cId = String(c.id);
            const isAccepted = (await AsyncStorage.getItem(`accepted_conn_${cId}`).catch(() => null)) === 'true';
            const isDeclined = (await AsyncStorage.getItem(`declined_conn_${cId}`).catch(() => null)) === 'true';
            if (isAccepted) {
              return { ...c, status: 'ACCEPTED' };
            }
            if (isDeclined) {
              return { ...c, status: 'DECLINED' };
            }
            return c;
          })
        );

        return [...syntheticConnections, ...updatedBackendConnections];
      } catch {
        return backendConnections;
      }
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
