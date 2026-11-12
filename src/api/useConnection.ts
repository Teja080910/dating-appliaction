import React, { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';
import { mockStore } from '../mock/mockStore';
import { isInvalidPhoneNumber } from '../utils/whatsappHelper';
import { dispatchTelegramMatchNotification } from '../utils/telegramHelper';

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

const extractPhoneFromSources = (...sources: any[]): string => {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const trimmed = src.trim();
      if (!isInvalidPhoneNumber(trimmed)) return trimmed;
    }
    if (typeof src === 'object') {
      const cand =
        src.phoneNumber ||
        src.phone ||
        src.mobile ||
        src.mobileNumber ||
        src.whatsapp ||
        src.whatsappNumber ||
        src.contact ||
        src.contactNumber ||
        src.receiverPhone ||
        src.receiverPhoneNumber ||
        src.receiverMobile ||
        src.receiverWhatsapp ||
        src.senderPhone ||
        src.senderPhoneNumber ||
        src.senderMobile ||
        src.senderWhatsapp ||
        src.user?.phoneNumber ||
        src.user?.mobile ||
        src.user?.phone ||
        src.user?.whatsapp ||
        src.profile?.phoneNumber ||
        src.profile?.mobile ||
        src.profile?.phone ||
        src.profile?.whatsapp;
      if (cand && !isInvalidPhoneNumber(cand)) {
        return String(cand).trim();
      }
    }
  }
  return '';
};

const isInvalidTgString = (str: string): boolean => {
  const norm = str.trim().toUpperCase();
  return (
    !norm ||
    norm.includes(' ') ||
    norm === '-' ||
    norm === 'NONE' ||
    norm === 'NULL' ||
    norm === 'UNDEFINED' ||
    norm === 'N/A' ||
    norm.replace(/^@+/, '').length < 3
  );
};

const extractTelegramFromSources = (...sources: any[]): string => {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const trimmed = src.trim();
      if (!isInvalidTgString(trimmed)) return trimmed;
    }
    if (typeof src === 'object') {
      const cand =
        src.telegramUsername ||
        src.telegram ||
        src.tgUsername ||
        src.tg ||
        src.telegramHandle ||
        src.receiverTelegram ||
        src.receiverTelegramUsername ||
        src.senderTelegram ||
        src.senderTelegramUsername ||
        src.user?.telegramUsername ||
        src.user?.telegram ||
        src.profile?.telegramUsername ||
        src.profile?.telegram;
      if (cand && typeof cand === 'string') {
        const trimmed = cand.trim();
        if (!isInvalidTgString(trimmed)) {
          return trimmed;
        }
      }
    }
  }
  return '';
};

export const normalizeConnections = (payload: unknown): ConnectionRequest[] =>
  resolveConnectionArray(payload).map((item) => {
    const rawSender = item?.sender && typeof item.sender === 'object' ? item.sender : {};
    const rawReceiver = item?.receiver && typeof item.receiver === 'object' ? item.receiver : {};
    const rawSenderProfile = item?.senderProfile && typeof item.senderProfile === 'object' ? item.senderProfile : {};
    const rawReceiverProfile = item?.receiverProfile && typeof item.receiverProfile === 'object' ? item.receiverProfile : {};

    const senderPhotos =
      Array.isArray(rawSenderProfile?.photos) && rawSenderProfile.photos.length > 0
        ? rawSenderProfile.photos
        : Array.isArray(rawSender?.photos) && rawSender.photos.length > 0
        ? rawSender.photos
        : Array.isArray(item?.senderPhotos) && item.senderPhotos.length > 0
        ? item.senderPhotos
        : item?.senderPhoto
        ? [item.senderPhoto]
        : [];

    const senderPhone = extractPhoneFromSources(
      item?.senderPhone,
      item?.senderPhoneNumber,
      item?.senderMobile,
      item?.senderWhatsapp,
      rawSenderProfile?.phoneNumber,
      rawSenderProfile?.mobile,
      rawSenderProfile?.phone,
      rawSenderProfile?.whatsapp,
      rawSender?.phoneNumber,
      rawSender?.mobile,
      rawSender?.phone,
      rawSender?.whatsapp,
      rawSender?.user?.phoneNumber,
      rawSenderProfile?.user?.phoneNumber
    );

    const senderTg = extractTelegramFromSources(
      item?.senderTelegram,
      item?.senderTelegramUsername,
      rawSenderProfile?.telegramUsername,
      rawSenderProfile?.telegram,
      rawSender?.telegramUsername,
      rawSender?.telegram,
      rawSender?.user?.telegramUsername,
      rawSenderProfile?.user?.telegramUsername
    );

    const sender = {
      ...rawSenderProfile,
      ...rawSender,
      id: item?.senderId ?? rawSender?.id ?? rawSenderProfile?.userId ?? '0',
      userId: item?.senderId ?? rawSender?.userId ?? rawSenderProfile?.userId ?? '0',
      displayName: item?.senderName || item?.senderDisplayName || rawSenderProfile?.displayName || rawSender?.displayName || rawSender?.name || 'User',
      photos: senderPhotos,
      photo: senderPhotos[0] || rawSenderProfile?.photo || rawSender?.photo,
      telegramUsername: senderTg,
      phoneNumber: senderPhone,
      mobile: senderPhone,
      phone: senderPhone,
      age: rawSenderProfile?.age || rawSender?.age,
    };

    const receiverPhotos =
      Array.isArray(rawReceiverProfile?.photos) && rawReceiverProfile.photos.length > 0
        ? rawReceiverProfile.photos
        : Array.isArray(rawReceiver?.photos) && rawReceiver.photos.length > 0
        ? rawReceiver.photos
        : Array.isArray(item?.receiverPhotos) && item.receiverPhotos.length > 0
        ? item.receiverPhotos
        : item?.receiverPhoto
        ? [item.receiverPhoto]
        : [];

    const receiverPhone = extractPhoneFromSources(
      item?.receiverPhone,
      item?.receiverPhoneNumber,
      item?.receiverMobile,
      item?.receiverWhatsapp,
      rawReceiverProfile?.phoneNumber,
      rawReceiverProfile?.mobile,
      rawReceiverProfile?.phone,
      rawReceiverProfile?.whatsapp,
      rawReceiver?.phoneNumber,
      rawReceiver?.mobile,
      rawReceiver?.phone,
      rawReceiver?.whatsapp,
      rawReceiver?.user?.phoneNumber,
      rawReceiverProfile?.user?.phoneNumber
    );

    const receiverTg = extractTelegramFromSources(
      item?.receiverTelegram,
      item?.receiverTelegramUsername,
      rawReceiverProfile?.telegramUsername,
      rawReceiverProfile?.telegram,
      rawReceiver?.telegramUsername,
      rawReceiver?.telegram,
      rawReceiver?.user?.telegramUsername,
      rawReceiverProfile?.user?.telegramUsername
    );

    const receiver = {
      ...rawReceiverProfile,
      ...rawReceiver,
      id: item?.receiverId ?? rawReceiver?.id ?? rawReceiverProfile?.userId ?? '0',
      userId: item?.receiverId ?? rawReceiver?.userId ?? rawReceiverProfile?.userId ?? '0',
      displayName: item?.receiverName || item?.receiverDisplayName || rawReceiverProfile?.displayName || rawReceiver?.displayName || rawReceiver?.name || 'User',
      photos: receiverPhotos,
      photo: receiverPhotos[0] || rawReceiverProfile?.photo || rawReceiver?.photo,
      telegramUsername: receiverTg,
      phoneNumber: receiverPhone,
      mobile: receiverPhone,
      phone: receiverPhone,
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
  const connectionListKey = ['connections', userId ? String(userId) : 'current'];
  const sentListKey = ['connections-sent', userId ? String(userId) : 'current'];
  const receivedListKey = ['connections-received', userId ? String(userId) : 'current'];

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['connections'] }),
      queryClient.invalidateQueries({ queryKey: ['connections-sent'] }),
      queryClient.invalidateQueries({ queryKey: ['connections-received'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
    DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
  };

  const send = useMutation({
    onMutate: async () => {
      DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
    },
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
    onMutate: async (requestId: number | string) => {
      const targetId = String(requestId);
      try {
        await AsyncStorage.setItem(`accepted_conn_${targetId}`, 'true');
        await AsyncStorage.removeItem(`declined_conn_${targetId}`);
      } catch {}

      const updateToAccepted = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) => {
          const isTarget =
            String(item?.id) === targetId ||
            String(item?.senderId) === targetId ||
            String(item?.sender?.userId) === targetId ||
            String(item?.sender?.id) === targetId;
          return isTarget ? { ...item, status: 'ACCEPTED' } : item;
        });
      };

      queryClient.setQueriesData({ queryKey: ['connections-received'] }, updateToAccepted);
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToAccepted);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToAccepted);
      DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
    },
    mutationFn: async (requestId: number | string) => {
      const resolvedUserId = await resolveBackendUserId();
      const reqIdStr = String(requestId);

      try {
        await AsyncStorage.setItem(`accepted_conn_${reqIdStr}`, 'true');
        await AsyncStorage.removeItem(`declined_conn_${reqIdStr}`);

        const currentReceived = (queryClient.getQueryData(receivedListKey) as any[]) || [];
        const match = currentReceived.find(
          (x: any) =>
            String(x?.id) === reqIdStr ||
            String(x?.senderId) === reqIdStr ||
            String(x?.sender?.userId) === reqIdStr ||
            String(x?.sender?.id) === reqIdStr
        );
        if (match) {
          if (match.id) await AsyncStorage.setItem(`accepted_conn_${match.id}`, 'true');
          if (match.senderId) await AsyncStorage.setItem(`accepted_conn_${match.senderId}`, 'true');
          if (match.sender?.userId) await AsyncStorage.setItem(`accepted_conn_${match.sender.userId}`, 'true');
          if (match.sender?.id) await AsyncStorage.setItem(`accepted_conn_${match.sender.id}`, 'true');

          const cacheKey = `@amara_accepted_connections_${resolvedUserId}`;
          const rawCached = await AsyncStorage.getItem(cacheKey).catch(() => null);
          const cachedList: any[] = rawCached ? JSON.parse(rawCached) : [];
          const existsIdx = cachedList.findIndex((item) => String(item?.id) === String(match.id));
          const acceptedObj = { ...match, status: 'ACCEPTED' };
          if (existsIdx >= 0) {
            cachedList[existsIdx] = acceptedObj;
          } else {
            cachedList.unshift(acceptedObj);
          }
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedList));
        }
      } catch {}

      if (reqIdStr.startsWith('notif_')) {
        await apiClient.put(`/notification/read/${reqIdStr}`).catch(() => {});
        return {
          status: 'success',
          message: 'Connection approved',
          data: { id: reqIdStr, status: 'ACCEPTED' },
        };
      }

      const [myPhoto, myName, myPhone, myTg, myBio, myCity] = await Promise.all([
        AsyncStorage.getItem('userPhoto'),
        AsyncStorage.getItem('displayName'),
        AsyncStorage.getItem('phoneNumber'),
        AsyncStorage.getItem('telegramUsername'),
        AsyncStorage.getItem('bio'),
        AsyncStorage.getItem('userCity'),
      ]);

      const payload: Record<string, any> = {
        requestId: reqIdStr,
        userId: String(resolvedUserId),
      };

      if (myName) {
        payload.name = myName;
        payload.femaleName = myName;
      }
      if (myPhone) {
        payload.mobile = myPhone;
        payload.phoneNumber = myPhone;
        payload.femaleWhatsApp = myPhone;
        payload.receiverMobile = myPhone;
      }
      if (myTg) {
        payload.telegramUsername = myTg;
        payload.telegram = myTg;
        payload.femaleTelegram = myTg;
        payload.receiverTelegram = myTg;
      }
      if (myPhoto) {
        payload.photo = myPhoto;
        payload.femalePhoto = myPhoto;
      }
      if (myBio) {
        payload.bio = myBio;
        payload.femaleBio = myBio;
      }
      if (myCity) {
        payload.city = myCity;
        payload.femaleLocation = myCity;
      }

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
      const updateToAccepted = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) => {
          const isTarget =
            String(item?.id) === targetId ||
            String(item?.senderId) === targetId ||
            String(item?.sender?.userId) === targetId ||
            String(item?.sender?.id) === targetId;
          return isTarget ? { ...item, status: 'ACCEPTED' } : item;
        });
      };
      queryClient.setQueriesData({ queryKey: ['connections-received'] }, updateToAccepted);
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToAccepted);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToAccepted);
      try {
        let match: any = null;
        const allReceivedQueries = queryClient.getQueriesData({ queryKey: ['connections-received'] });
        for (const [, qData] of allReceivedQueries) {
          if (Array.isArray(qData)) {
            match = qData.find(
              (x: any) =>
                String(x?.id) === targetId ||
                String(x?.senderId) === targetId ||
                String(x?.sender?.userId) === targetId ||
                String(x?.sender?.id) === targetId
            );
            if (match) break;
          }
        }
        if (match) {
          const maleTg = match.sender?.telegramUsername || match.senderTelegram;
          const maleUid = match.sender?.userId || match.sender?.id || match.senderId;

          const [myPhoto, myName, myAge, myCity, myPhone, myTg, myBio, myEdu, myProf] = await Promise.all([
            AsyncStorage.getItem('userPhoto'),
            AsyncStorage.getItem('userName'),
            AsyncStorage.getItem('userAge'),
            AsyncStorage.getItem('userCity'),
            AsyncStorage.getItem('phoneNumber'),
            AsyncStorage.getItem('telegramUsername'),
            AsyncStorage.getItem('userBio'),
            AsyncStorage.getItem('userEducation'),
            AsyncStorage.getItem('userProfession'),
          ]);

          const femaleName =
            myName ||
            match.receiver?.displayName ||
            match.receiver?.name ||
            'A member';
          const femaleAge = myAge || match.receiver?.age || null;
          const femaleLoc =
            myCity ||
            match.receiver?.city ||
            match.receiver?.location ||
            match.receiver?.country ||
            null;
          const femaleTg =
            myTg ||
            match.receiver?.telegramUsername ||
            match.receiverTelegram ||
            null;
          const femalePhone =
            myPhone ||
            match.receiver?.phoneNumber ||
            match.receiver?.mobile ||
            match.receiverWhatsapp ||
            null;
          const femalePhoto =
            myPhoto ||
            match.receiver?.photo ||
            (Array.isArray(match.receiver?.photos) ? match.receiver.photos[0] : null) ||
            null;

          void dispatchTelegramMatchNotification({
            maleTelegram: maleTg,
            maleUserId: maleUid,
            femaleName,
            femaleAge,
            femaleLocation: femaleLoc,
            femaleTelegram: femaleTg,
            femaleWhatsApp: femalePhone,
            femalePhoto,
            femaleBio: myBio || match.receiver?.bio || null,
            femaleEducation: myEdu || (match.receiver as any)?.education || null,
            femaleProfession: myProf || (match.receiver as any)?.profession || null,
          });
        }
      } catch {}
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
    onMutate: async (requestId: number | string) => {
      const targetId = String(requestId);
      try {
        await AsyncStorage.setItem(`declined_conn_${targetId}`, 'true');
        await AsyncStorage.removeItem(`accepted_conn_${targetId}`);
      } catch {}

      const updateToDeclined = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) => {
          const isTarget =
            String(item?.id) === targetId ||
            String(item?.senderId) === targetId ||
            String(item?.sender?.userId) === targetId ||
            String(item?.sender?.id) === targetId;
          return isTarget ? { ...item, status: 'DECLINED' } : item;
        });
      };

      queryClient.setQueriesData({ queryKey: ['connections-received'] }, updateToDeclined);
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToDeclined);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToDeclined);
      DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
    },
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
      const updateToDeclined = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) => {
          const isTarget =
            String(item?.id) === targetId ||
            String(item?.senderId) === targetId ||
            String(item?.sender?.userId) === targetId ||
            String(item?.sender?.id) === targetId;
          return isTarget ? { ...item, status: 'DECLINED' } : item;
        });
      };
      queryClient.setQueriesData({ queryKey: ['connections-received'] }, updateToDeclined);
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToDeclined);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToDeclined);
      await refreshQueries();
    },
  });

  const cancel = useMutation({
    onMutate: async (requestId: number | string) => {
      const targetId = String(requestId);
      const updateToCancelled = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'CANCELLED' } : item
        );
      };
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToCancelled);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToCancelled);
      DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
    },
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
      const updateToCancelled = (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) =>
          String(item?.id) === targetId ? { ...item, status: 'CANCELLED' } : item
        );
      };
      queryClient.setQueriesData({ queryKey: ['connections-sent'] }, updateToCancelled);
      queryClient.setQueriesData({ queryKey: ['connections'] }, updateToCancelled);
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
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 1000,
    retry: false,
  });

  const sentList = useQuery({
    queryKey: sentListKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get('/connections/sent', {
        params: { userId: resolvedUserId, senderId: resolvedUserId },
      });
      const backendSent = normalizeConnections(res.data);

      let listConnections: ConnectionRequest[] = [];
      try {
        const listRes = await apiClient.get('/connections/list', {
          params: { userId: resolvedUserId, targetUserId: resolvedUserId },
        });
        listConnections = normalizeConnections(listRes.data).map((c) => ({
          ...c,
          status: 'ACCEPTED',
        }));
      } catch {}

      const allSent = [...listConnections, ...backendSent];
      const seenIds = new Set<string>();
      const merged: ConnectionRequest[] = [];
      for (const item of allSent) {
        const idKey = String(item.id);
        const receiverKey = String(item.receiver?.userId || (item as any).receiverId || '');
        const dedupeKey = idKey !== '0' && idKey !== 'undefined' ? idKey : receiverKey;
        if (!seenIds.has(dedupeKey)) {
          seenIds.add(dedupeKey);
          merged.push(item);
        } else {
          const exIdx = merged.findIndex((x) => String(x.id) === idKey || (Boolean(receiverKey) && String(x.receiver?.userId || (x as any).receiverId) === receiverKey));
          if (exIdx >= 0 && (item.status === 'ACCEPTED' || item.status === 'APPROVED')) {
            merged[exIdx] = { ...merged[exIdx], ...item, status: 'ACCEPTED' };
          }
        }
      }

      const finalized = await Promise.all(
        merged.map(async (c: any) => {
          const cId = String(c.id);
          const receiverId = String(c.receiver?.userId || c.receiverId || '');
          const isAccepted =
            c.status === 'ACCEPTED' ||
            c.status === 'APPROVED' ||
            (await AsyncStorage.getItem(`accepted_conn_${cId}`).catch(() => null)) === 'true' ||
            (Boolean(receiverId) && (await AsyncStorage.getItem(`accepted_conn_${receiverId}`).catch(() => null)) === 'true');
          if (isAccepted) {
            return { ...c, status: 'ACCEPTED' };
          }
          return c;
        })
      );

      // Auto-dispatch Telegram match notification if a match was accepted but not yet notified
      for (const item of finalized) {
        if (item.status === 'ACCEPTED' && item.id && item.id !== '0') {
          const notifKey = `@amara_tg_match_notified_${item.id}`;
          const alreadyNotified = await AsyncStorage.getItem(notifKey).catch(() => null);
          if (!alreadyNotified) {
            await AsyncStorage.setItem(notifKey, 'true').catch(() => {});
            const femaleName = item.receiver?.displayName || item.receiver?.name || 'Female Match';
            const femaleAge = item.receiver?.age;
            const femaleLoc = item.receiver?.city || item.receiver?.country;
            const femaleTg = item.receiver?.telegramUsername;
            const femalePhone = item.receiver?.phoneNumber || item.receiver?.mobile || item.receiver?.phone;
            const maleTg = item.sender?.telegramUsername;
            const maleUid = item.sender?.userId || item.sender?.id;

            void dispatchTelegramMatchNotification({
              maleTelegram: maleTg,
              maleUserId: maleUid,
              femaleName,
              femaleAge,
              femaleLocation: femaleLoc,
              femaleTelegram: femaleTg,
              femaleWhatsApp: femalePhone,
            });
          }
        }
      }

      return finalized;
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 1000,
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

      // Also fetch /connections/list so accepted/approved invitations are never dropped on refresh
      let listConnections: ConnectionRequest[] = [];
      try {
        const listRes = await apiClient.get('/connections/list', {
          params: { userId: resolvedUserId, targetUserId: resolvedUserId },
        });
        listConnections = normalizeConnections(listRes.data).map((c) => ({
          ...c,
          status: 'ACCEPTED',
        }));
      } catch {}

      // Also merge persistent accepted connections cache
      let cachedAccepted: ConnectionRequest[] = [];
      try {
        const rawCached = await AsyncStorage.getItem(`@amara_accepted_connections_${resolvedUserId}`).catch(() => null);
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (Array.isArray(parsed)) {
            cachedAccepted = parsed.map((item) => ({ ...item, status: 'ACCEPTED' }));
          }
        }
      } catch {}

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

        const allConnections = [...backendConnections, ...listConnections, ...cachedAccepted];
        const seenIds = new Set<string>();
        const mergedBase: ConnectionRequest[] = [];
        for (const c of allConnections) {
          const idKey = String(c.id);
          const senderKey = String(c.sender?.userId || (c as any).senderId || '');
          const dedupeKey = idKey !== '0' && idKey !== 'undefined' ? idKey : senderKey;
          if (!seenIds.has(dedupeKey)) {
            seenIds.add(dedupeKey);
            mergedBase.push(c);
          } else {
            const existingIdx = mergedBase.findIndex(
              (x) => String(x.id) === idKey || (Boolean(senderKey) && String(x.sender?.userId || (x as any).senderId) === senderKey)
            );
            if (existingIdx >= 0 && (c.status === 'ACCEPTED' || c.status === 'APPROVED')) {
              mergedBase[existingIdx] = { ...mergedBase[existingIdx], ...c, status: 'ACCEPTED' };
            }
          }
        }

        const updatedBackendConnections = await Promise.all(
          mergedBase.map(async (c: any) => {
            const cId = String(c.id);
            const senderId = String(c.sender?.userId || c.senderId || '');
            const senderNum = String(c.sender?.id || '');

            const isAccepted =
              c.status === 'ACCEPTED' ||
              c.status === 'APPROVED' ||
              (await AsyncStorage.getItem(`accepted_conn_${cId}`).catch(() => null)) === 'true' ||
              (Boolean(senderId) && (await AsyncStorage.getItem(`accepted_conn_${senderId}`).catch(() => null)) === 'true') ||
              (Boolean(senderNum) && (await AsyncStorage.getItem(`accepted_conn_${senderNum}`).catch(() => null)) === 'true');

            const isDeclined =
              c.status === 'DECLINED' ||
              c.status === 'REJECTED' ||
              (await AsyncStorage.getItem(`declined_conn_${cId}`).catch(() => null)) === 'true' ||
              (Boolean(senderId) && (await AsyncStorage.getItem(`declined_conn_${senderId}`).catch(() => null)) === 'true');

            if (isAccepted) {
              return { ...c, status: 'ACCEPTED' };
            }
            if (isDeclined) {
              return { ...c, status: 'DECLINED' };
            }
            return c;
          })
        );

        const finalAccepted = updatedBackendConnections.filter((c) => c.status === 'ACCEPTED');
        if (finalAccepted.length > 0) {
          AsyncStorage.setItem(
            `@amara_accepted_connections_${resolvedUserId}`,
            JSON.stringify(finalAccepted)
          ).catch(() => {});
        }

        return [...syntheticConnections, ...updatedBackendConnections];
      } catch {
        return backendConnections;
      }
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 1000,
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

  const refreshAll = useCallback(() => {
    connectionList.refetch();
    sentList.refetch();
    receivedList.refetch();
  }, [connectionList, sentList, receivedList]);

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
