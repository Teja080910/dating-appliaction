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
  remainingDays?: number;
  durationDays?: number;
  raw: any;
}

const normalizeSubscriptionStatus = (payload: any): NormalizedSubscriptionStatus | null => {
  const source =
    (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
      ? payload.data
      : payload) || {};

  const endDate = source?.endDate ? String(source.endDate) : null;
  const isExpired = endDate ? new Date(endDate).getTime() <= Date.now() : false;

  const rawActive = Boolean(
    source?.active ??
    source?.isActive ??
    source?.subscribed ??
    source?.isSubscribed ??
    (typeof source?.status === 'string' &&
      String(source.status).trim().toUpperCase() === 'ACTIVE'),
  );

  const active = rawActive && !isExpired;

  const rawPlan = source?.plan
    ? String(source.plan).toUpperCase()
    : source?.type
      ? String(source.type).toUpperCase()
      : source?.planType
        ? String(source.planType).toUpperCase()
        : null;

  const plan =
    rawPlan === 'BASIC' || rawPlan === 'STANDARD'
      ? 'STANDARD'
      : rawPlan === 'GOLD' || rawPlan === 'PREMIUM'
      ? 'PREMIUM'
      : rawPlan === 'ELITE' || rawPlan === 'YEARLY'
      ? 'ELITE'
      : rawPlan;

  const remainingDays =
    source?.remainingDays != null
      ? Number(source.remainingDays)
      : source?.daysRemaining != null
      ? Number(source.daysRemaining)
      : endDate
      ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const dailyRequestLimit =
    source?.dailyRequestLimit != null
      ? Number(source.dailyRequestLimit)
      : plan === 'STANDARD'
      ? 10
      : plan === 'PREMIUM'
      ? 20
      : plan === 'ELITE'
      ? null
      : 10;

  const durationDays =
    source?.durationDays != null
      ? Number(source.durationDays)
      : plan === 'STANDARD'
      ? 120
      : plan === 'PREMIUM'
      ? 180
      : 365;

  return {
    active,
    plan,
    startDate: source?.startDate ? String(source.startDate) : null,
    endDate,
    priorityHandoff: Boolean(source?.priorityHandoff || plan === 'PREMIUM' || plan === 'ELITE'),
    eliteBadge: Boolean(source?.eliteBadge || plan === 'ELITE'),
    dailyRequestLimit,
    remainingDays,
    durationDays,
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

export interface BackendSubscriptionPlan {
  plan: string;
  displayName: string;
  price: number;
  durationDays: number;
  dailyRequestLimit: number | null;
  unlimited: boolean;
  limitLabel: string;
  tagline: string;
  description: string;
  worldwideSearch: boolean;
  eliteBadge: boolean;
  priorityHandoff: boolean;
  popular: boolean;
  bestValue: boolean;
}

export interface ClientSubscriptionPlan {
  id: string;
  canonicalId: string;
  type: string;
  label: string;
  name: string;
  price: string;
  amount: number;
  unit: string;
  billedText: string;
  subText: string;
  durationDays: number;
  dailyRequestLimit: number | null;
  unlimited: boolean;
  limitLabel: string;
  contactView: string;
  tagline: string;
  description: string;
  worldwideSearch: boolean;
  eliteBadge: boolean;
  priorityHandoff: boolean;
  popular: boolean;
  bestValue: boolean;
  badge?: 'POPULAR' | 'BEST VALUE' | string;
}

export const DEFAULT_SUBSCRIPTION_PLANS: BackendSubscriptionPlan[] = [
  {
    plan: 'STANDARD',
    displayName: 'Standard',
    price: 1,
    durationDays: 120,
    dailyRequestLimit: 10,
    unlimited: false,
    limitLabel: '10 requests/day',
    tagline: 'Invite up to 10 members per day',
    description: 'Standard Plan: 10 daily connection requests for 120 days.',
    worldwideSearch: false,
    eliteBadge: false,
    priorityHandoff: false,
    popular: false,
    bestValue: false,
  },
  {
    plan: 'PREMIUM',
    displayName: 'Premium',
    price: 2,
    durationDays: 180,
    dailyRequestLimit: 20,
    unlimited: false,
    limitLabel: '20 requests/day',
    tagline: 'Invite up to 20 members per day',
    description: 'Premium Plan: 20 daily connection requests for 180 days.',
    worldwideSearch: true,
    eliteBadge: false,
    priorityHandoff: true,
    popular: true,
    bestValue: false,
  },
  {
    plan: 'ELITE',
    displayName: 'Elite',
    price: 3,
    durationDays: 365,
    dailyRequestLimit: null,
    unlimited: true,
    limitLabel: 'Unlimited requests',
    tagline: 'Invite unlimited members per day',
    description: 'Elite Plan: unlimited daily connection requests for 365 days.',
    worldwideSearch: true,
    eliteBadge: true,
    priorityHandoff: true,
    popular: false,
    bestValue: true,
  },
];

export const normalizeBackendPlan = (item: any): ClientSubscriptionPlan => {
  const planCode = toBackendPlanName(item?.plan || item?.id || item?.type || 'STANDARD');
  const displayName = item?.displayName || item?.name || item?.label || (planCode === 'STANDARD' ? 'Standard' : planCode === 'PREMIUM' ? 'Premium' : 'Elite');
  const priceNum = typeof item?.price === 'number' ? item.price : Number(item?.price || item?.amount || 0);
  const duration = typeof item?.durationDays === 'number' ? item.durationDays : Number(item?.durationDays || (planCode === 'STANDARD' ? 120 : planCode === 'PREMIUM' ? 180 : 365));
  const unlimited = Boolean(item?.unlimited || item?.dailyRequestLimit == null || planCode === 'ELITE');
  const limitLabel = item?.limitLabel || (unlimited ? 'Unlimited requests' : `${item?.dailyRequestLimit ?? (planCode === 'PREMIUM' ? 20 : 10)} requests/day`);
  const popular = Boolean(item?.popular || (planCode === 'PREMIUM' && item?.popular !== false));
  const bestValue = Boolean(item?.bestValue || (planCode === 'ELITE' && item?.bestValue !== false));

  return {
    id: planCode,
    canonicalId: planCode,
    type: planCode,
    label: displayName,
    name: displayName,
    price: `₹${priceNum || (planCode === 'STANDARD' ? 1 : planCode === 'PREMIUM' ? 2 : 3)}`,
    amount: priceNum || (planCode === 'STANDARD' ? 1 : planCode === 'PREMIUM' ? 2 : 3),
    unit: '',
    billedText: `${duration} Days`,
    subText: limitLabel,
    durationDays: duration,
    dailyRequestLimit: unlimited ? null : (item?.dailyRequestLimit != null ? Number(item.dailyRequestLimit) : (planCode === 'PREMIUM' ? 20 : 10)),
    unlimited,
    limitLabel,
    contactView: unlimited ? 'UNLIMITED' : String(item?.dailyRequestLimit ?? (planCode === 'PREMIUM' ? '20' : '10')),
    tagline: item?.tagline || (unlimited ? 'Invite unlimited members per day' : `Invite up to ${item?.dailyRequestLimit ?? (planCode === 'PREMIUM' ? 20 : 10)} members per day`),
    description: item?.description || (unlimited ? 'Elite Plan: unlimited daily connection requests for 365 days.' : `${displayName} Plan: ${limitLabel} for ${duration} days.`),
    worldwideSearch: Boolean(item?.worldwideSearch || planCode === 'PREMIUM' || planCode === 'ELITE'),
    eliteBadge: Boolean(item?.eliteBadge || planCode === 'ELITE'),
    priorityHandoff: Boolean(item?.priorityHandoff || planCode === 'PREMIUM' || planCode === 'ELITE'),
    popular,
    bestValue,
    badge: popular ? 'POPULAR' : bestValue ? 'BEST VALUE' : undefined,
  };
};

export const fetchSubscriberPlans = async (): Promise<ClientSubscriptionPlan[]> => {
  try {
    const response = await apiClient
      .get('/subscriber/plans')
      .catch(() => apiClient.get('/subscription/plans'));

    const data = response?.data;
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.plans)
      ? data.plans
      : null;

    if (rawList && rawList.length > 0) {
      return rawList.map(normalizeBackendPlan);
    }
  } catch (err: any) {
    if (__DEV__) {
      console.warn('⚠️ [Subscription] Failed to fetch /subscriber/plans, falling back to defaults:', err?.message || err);
    }
  }

  return DEFAULT_SUBSCRIPTION_PLANS.map(normalizeBackendPlan);
};

export const useSubscriberPlans = () => {
  return useQuery<ClientSubscriptionPlan[]>({
    queryKey: ['subscriber-plans'],
    queryFn: fetchSubscriberPlans,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: DEFAULT_SUBSCRIPTION_PLANS.map(normalizeBackendPlan),
  });
};

/**
 * Hook for Subscription & Payment (Razorpay)
 * Swagger: subscription-controller
 */
export const useSubscription = (userId?: string | null) => {
  const queryClient = useQueryClient();
  const plansQuery = useSubscriberPlans();
  const statusQueryKey = ['subscription-status', userId ? String(userId) : 'me'];
  const resolveBackendUserId = async () => {
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId();
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    return null;
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

      const durationDays = targetPlan === 'STANDARD' ? 120 : targetPlan === 'PREMIUM' ? 180 : 365;
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      await AsyncStorage.setItem('isSubscribed', 'true');
      await AsyncStorage.setItem('@subscription_plan', targetPlan);
      await AsyncStorage.setItem('@subscription_endDate', endDate);
      await AsyncStorage.setItem('@subscription_remainingDays', String(durationDays));

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

      // Calculate end date based on plan
      const durationDays = targetPlan === 'STANDARD' ? 120 : targetPlan === 'PREMIUM' ? 180 : 365;
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      // Cache subscription locally
      await AsyncStorage.setItem('isSubscribed', 'true');
      await AsyncStorage.setItem('@subscription_plan', targetPlan);
      await AsyncStorage.setItem('@subscription_endDate', endDate);
      await AsyncStorage.setItem('@subscription_remainingDays', String(durationDays));
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
      const resolvedUserId = await resolveBackendUserId().catch(() => null);
      try {
        if (!resolvedUserId) {
          return normalizeSubscriptionStatus(null);
        }
        const response = await apiClient
          .get('/subscriber/status', {
            params: { userId: resolvedUserId },
          })
          .catch(() =>
            apiClient.get('/subscription/status', {
              params: { userId: resolvedUserId },
            })
          );

        const normalized = normalizeSubscriptionStatus(response?.data);
        if (normalized?.active) {
          await AsyncStorage.setItem('isSubscribed', 'true');
          await AsyncStorage.setItem(`isSubscribed_${resolvedUserId}`, 'true');
          if (normalized.plan) {
            await AsyncStorage.setItem('@subscription_plan', normalized.plan);
            await AsyncStorage.setItem(`@subscription_plan_${resolvedUserId}`, normalized.plan);
          }
          if (normalized.endDate) {
            await AsyncStorage.setItem('@subscription_endDate', normalized.endDate);
            await AsyncStorage.setItem(`@subscription_endDate_${resolvedUserId}`, normalized.endDate);
          }
          if (normalized.remainingDays != null) {
            await AsyncStorage.setItem('@subscription_remainingDays', String(normalized.remainingDays));
            await AsyncStorage.setItem(`@subscription_remainingDays_${resolvedUserId}`, String(normalized.remainingDays));
          }
          return normalized;
        }

        // The server explicitly reports no active subscription. Never revive a
        // stale local cache from a previous account/session.
        await AsyncStorage.multiRemove([
          'isSubscribed',
          '@subscription_plan',
          '@subscription_endDate',
          '@subscription_remainingDays',
          `isSubscribed_${resolvedUserId}`,
          `@subscription_plan_${resolvedUserId}`,
          `@subscription_endDate_${resolvedUserId}`,
          `@subscription_remainingDays_${resolvedUserId}`,
        ]);
        return normalized;
      } catch (err: any) {
        if (resolvedUserId) {
          const localSub = await AsyncStorage.getItem(`isSubscribed_${resolvedUserId}`);
          const localPlan = await AsyncStorage.getItem(`@subscription_plan_${resolvedUserId}`);
          const localEndDate = await AsyncStorage.getItem(`@subscription_endDate_${resolvedUserId}`);
          const isLocallyExpired = localEndDate ? new Date(localEndDate).getTime() <= Date.now() : false;

          if (localSub === 'true' && !isLocallyExpired) {
            const targetPlan = localPlan ? toBackendPlanName(localPlan) : 'STANDARD';
            const durationDays = targetPlan === 'STANDARD' ? 120 : targetPlan === 'PREMIUM' ? 180 : 365;
            const remainingDays = localEndDate
              ? Math.max(0, Math.ceil((new Date(localEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : durationDays;
            return {
              active: true,
              plan: targetPlan,
              startDate: null,
              endDate: localEndDate,
              priorityHandoff: targetPlan === 'PREMIUM' || targetPlan === 'ELITE',
              eliteBadge: targetPlan === 'ELITE',
              dailyRequestLimit: targetPlan === 'STANDARD' ? 10 : targetPlan === 'PREMIUM' ? 20 : null,
              remainingDays,
              durationDays,
              raw: { isSubscribed: true },
            };
          }
        }
        return normalizeSubscriptionStatus(null);
      }
    },
    retry: false,
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
          userId: String(resolvedUserId),
          plan: planToTry,
        };

        const response = await apiClient
          .post('/razorpay/create-order', payload)
          .catch(async (err: any) => {
            if (err?.response?.status === 404) {
              return apiClient.post('/order/create', payload);
            }
            throw err;
          });

        return normalizeRazorpayResponse(response.data);
      };

      try {
        return await requestOrder(targetPlan);
      } catch (err: any) {
        if (err?.response?.status === 400) {
          const alternatives = ['BASIC', 'GOLD', 'STANDARD', 'PREMIUM', 'ELITE']
            .filter((p) => p !== targetPlan);
          for (const alt of alternatives) {
            try {
              console.log(`[Subscription] Server rejected plan ${targetPlan}, retrying with ${alt}...`);
              return await requestOrder(alt);
            } catch (retryErr: any) {
              if (retryErr?.response?.status !== 400) throw retryErr;
            }
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

    plans: plansQuery.data || DEFAULT_SUBSCRIPTION_PLANS.map(normalizeBackendPlan),
    isLoadingPlans: plansQuery.isLoading,
    refetchPlans: plansQuery.refetch,
    usePlans: useSubscriberPlans,

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
