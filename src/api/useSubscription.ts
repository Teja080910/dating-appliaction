import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';

const getApiErrorMessage = (err: any, fallback = 'Request failed') =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data === 'string' ? err.response.data : null) ||
  err?.message ||
  fallback;

export interface NormalizedSubscriptionStatus {
  active: boolean;
  plan: string | null;
  startDate: string | null;
  endDate: string | null;
  priorityHandoff?: boolean;
  eliteBadge?: boolean;
  dailyRequestLimit?: number | null;
  raw: any;
}

const normalizeSubscriptionStatus = (payload: any): NormalizedSubscriptionStatus | null => {
  //if (!payload) {
    //return null;
  //}

  const source =
    (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
      ? payload.data
      : payload) || {};

  return {
    active: Boolean(
      source?.active ??
      source?.isActive ??
      source?.subscribed ??
      source?.isSubscribed ??
      (typeof source?.status === 'string' &&
        String(source.status).trim().toUpperCase() === 'ACTIVE'),
    ),
    plan: source?.plan
      ? String(source.plan)
      : source?.type
        ? String(source.type)
        : source?.planType
          ? String(source.planType)
          : null,
    startDate: source?.startDate ? String(source.startDate) : null,
    endDate: source?.endDate ? String(source.endDate) : null,
    priorityHandoff: Boolean(source?.priorityHandoff),
    eliteBadge: Boolean(source?.eliteBadge),
    dailyRequestLimit: source?.dailyRequestLimit == null ? null : Number(source.dailyRequestLimit),
    raw: payload,
  };
};

const normalizeRazorpayResponse = (payload: any) => {
  if (!payload) {
    return {};
  }

  if (Array.isArray(payload)) {
    return payload[0] ?? {};
  }

  if (typeof payload === 'string') {
    return { message: payload };
  }

  if (payload && typeof payload === 'object') {
    const nestedData =
      payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data
        : null;

    return {
      ...payload,
      ...(nestedData || {}),
      data: nestedData || payload.data,
    };
  }

  return {};
};

export const toBackendPlanName = (plan: unknown): string => {
  const p = String(plan || '').trim().toUpperCase();
  if (p === 'STANDARD' || p === 'MONTHLY' || p === 'BASIC' || p === 'SILVER') return 'STANDARD';
  if (p === 'PREMIUM' || p === 'GOLD' || p === 'VIP') return 'PREMIUM';
  if (p === 'ELITE' || p === 'YEARLY' || p === 'ANNUAL' || p === 'PLATINUM') return 'ELITE';
  return p || 'STANDARD';
};

/**
 * Hook for Subscription & Payment (Razorpay)
 * Swagger: subscription-controller
 */
export const useSubscription = (userId?: string | null) => {
  const queryClient = useQueryClient();
  const statusQueryKey = ['subscription-status'];
  const resolveBackendUserId = async () => {
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId();
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    throw new Error('Unable to resolve backend userId from session.');
  };

  const activateSubscription = useMutation({
    mutationFn: async ({
      uid,
      plan,
    }: {
      uid?: any;
      plan: string;
    }) => {
      const resolvedUserId = uid ? String(uid) : await resolveBackendUserId();
      const targetPlan = toBackendPlanName(plan);
      const payload = {
        userId: resolvedUserId,
        plan: targetPlan,
      };

      const response = await apiClient
        .post('/subscriber/activate', null, {
          params: payload,
        })
        .catch(() =>
          apiClient.post('/subscription/activate', null, {
            params: payload,
          })
        );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: statusQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['subscription-remaining-days'] });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    },
    onError: (err: any) => {
      console.warn('Activate Subscription Error:', getApiErrorMessage(err));
    },
  });

  const verifyPayment = useMutation({
    mutationFn: async ({
      orderId,
      paymentId,
      signature,
      plan,
      userId: customUserId,
    }: {
      orderId: string;
      paymentId: string;
      signature: string;
      plan?: string;
      userId?: string;
    }) => {
      const resolvedUserId = customUserId || (await resolveBackendUserId().catch(() => null));
      const targetPlan = toBackendPlanName(plan);
      const payload = {
        orderId,
        paymentId,
        signature,
        plan: targetPlan,
        ...(resolvedUserId ? { userId: resolvedUserId } : {}),
      };

      const response = await apiClient.post('/razorpay/verify', payload, {
        params: resolvedUserId ? { userId: resolvedUserId, plan: targetPlan } : { plan: targetPlan },
      });

      // Cache subscription locally
      await AsyncStorage.setItem('isSubscribed', 'true');
      await AsyncStorage.setItem('@subscription_plan', targetPlan);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: statusQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['subscription-remaining-days'] });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    },
    onError: (err: any) => {
      console.warn('Verify Payment Error:', getApiErrorMessage(err));
    },
  });

  const subStatus = useQuery({
    queryKey: statusQueryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient
        .get('/subscription/status', {
          params: { userId: resolvedUserId },
        })
        .catch(() =>
          apiClient.get('/subscriber/status', {
            params: { userId: resolvedUserId },
          })
        );

      return normalizeSubscriptionStatus(response.data);
    },
  });

  const sendSubscriptionRequest = useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId?: string | number; receiverId: string | number }) => {
      const resolvedSenderId = senderId ? String(senderId) : await resolveBackendUserId();
      const response = await apiClient.post('/subscription/request', null, {
        params: {
          senderId: resolvedSenderId,
          receiverId: String(receiverId),
        },
      });
      return response.data;
    },
  });

  const respondSubscriptionRequest = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number | string; status: string }) => {
      const response = await apiClient.put('/subscription/respond', null, {
        params: {
          requestId,
          status,
        },
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: statusQueryKey });
    },
  });

  const createOrder = useMutation({
    mutationFn: async ({ uid, plan }: { uid?: any; plan: string }) => {
      const resolvedUserId = uid ? String(uid) : await resolveBackendUserId();
      const targetPlan = toBackendPlanName(plan);

      const requestOrder = async (planToTry: string) => {
        const payload = {
          userId: resolvedUserId,
          plan: planToTry,
        };

        const response = await apiClient
          .post('/razorpay/create-order', payload, {
            params: payload,
          })
          .catch(async (err: any) => {
            if (err?.response?.status === 404) {
              return apiClient.post('/order/create', payload, { params: payload });
            }
            throw err;
          });

        return normalizeRazorpayResponse(response.data);
      };

      try {
        return await requestOrder(targetPlan);
      } catch (err: any) {
        if (err?.response?.status === 400) {
          const capitalized = targetPlan.charAt(0) + targetPlan.slice(1).toLowerCase();
          console.log(`[Subscription] Server rejected plan ${targetPlan}, retrying with ${capitalized}...`);
          try {
            return await requestOrder(capitalized);
          } catch {
            return await requestOrder('STANDARD');
          }
        }
        throw err;
      }
    },
    onError: (err: any) => {
      console.warn('Create Order Error:', getApiErrorMessage(err));
    },
  });

  const razorpayWebhook = useMutation({
    mutationFn: async ({ signature, body }: { signature: string; body: string | Record<string, unknown> }) => {
      const response = await apiClient.post('/razorpay/webhook', body, {
        headers: {
          'X-Razorpay-Signature': String(signature).trim(),
          'Content-Type': 'application/json',
        },
      });
      return normalizeRazorpayResponse(response.data);
    },
    onError: (err: any) => {
      console.warn('Razorpay Webhook Error:', getApiErrorMessage(err));
    },
  });

  return {
    activateSubscription,
    verifyPayment,
    subscriptionStatus: subStatus.data,
    isLoadingStatus: subStatus.isLoading,
    isFetchingStatus: subStatus.isFetching,
    statusError: subStatus.error ? getApiErrorMessage(subStatus.error, 'Failed to load subscription status.') : null,
    refetchStatus: subStatus.refetch,
    sendSubscriptionRequest,
    respondSubscriptionRequest,
    createOrder,
    razorpayWebhook,

    useSubscriptionStatus: () => subStatus,
    subscriptionDetails: () => subStatus,
  };
};

export const useRemainingDays = (userId?: string | null) => {
  const getRemainingDays = useQuery({
    queryKey: ['subscription-remaining-days', userId ? String(userId) : 'me'],
    queryFn: async () => {
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        resolvedUserId = await getUserId().catch(() => null);
      }
      if (!resolvedUserId) {
        const session = await getAuthSession();
        resolvedUserId = session?.userId;
      }
      if (!resolvedUserId) return 0;

      const res = await apiClient.get('/subscriber/remaining-days', {
        params: { userId: resolvedUserId },
      });
      if (typeof res.data === 'number') {
        return res.data;
      }

      if (res.data && typeof res.data === 'object') {
        const value = Number((res.data as any).remainingDays ?? (res.data as any).days);
        return Number.isFinite(value) ? value : 0;
      }

      const value = Number(res.data);
      return Number.isFinite(value) ? value : 0;
    },
  });

  return { getRemainingDays, remainingDays: getRemainingDays.data ?? 0 };
};
