import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';

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
      source?.isSubscribed,
    ),
    plan: source?.plan ? String(source.plan) : null,
    startDate: source?.startDate ? String(source.startDate) : null,
    endDate: source?.endDate ? String(source.endDate) : null,
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

/**
 * Hook for Subscription & Payment (Razorpay)
 * Swagger: subscription-controller
 */
export const useSubscription = (userId?: string | null) => {
  const queryClient = useQueryClient();
  const statusQueryKey = ['subscription-status'];
  const resolveBackendUserId = async () => {
    const resolvedUserId = userId || (await getUserId());
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return Number(resolvedUserId);
  };

  const activateSubscription = useMutation({
    mutationFn: async ({
      uid,
      plan,
    }: {
      uid?: any;
      plan: string;
    }) => {
      const resolvedUserId = uid ? Number(uid) : await resolveBackendUserId();
      const response = await apiClient.post('/subscription/activate', null, {
        params: {
          userId: resolvedUserId,
          plan,
        },
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: statusQueryKey });
    },
    onError: (err: any) => {
      console.warn('Activate Subscription Error:', getApiErrorMessage(err));
    },
  });

  const verifyPayment = useMutation({
    mutationFn: async ({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) => {
      const response = await apiClient.post('/payment/success', {
        orderId,
        paymentId,
        signature,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: statusQueryKey });
    },
    onError: (err: any) => {
      console.warn('Verify Payment Error:', getApiErrorMessage(err));
    },
  });

  const subscriptionRequest = useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId?: any; receiverId: any }) => {
      const resolvedSenderId = senderId ? Number(senderId) : await resolveBackendUserId();
      const response = await apiClient.post('/subscription/request', null, {
        params: {
          senderId: resolvedSenderId,
          receiverId: toApiUserId(receiverId),
        },
      });
      return response.data;
    },
    onError: (err: any) => {
      console.warn('Subscription Request Error:', getApiErrorMessage(err));
    },
  });

  const subscriptionRespond = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiClient.put('/subscription/respond', null, {
        params: {
          requestId,
          status,
        },
      });
      return response.data;
    },
    onError: (err: any) => {
      console.warn('Respond Error:', getApiErrorMessage(err));
    },
  });

  const subStatus = useQuery({
    queryKey: statusQueryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient.get('/subscription/status', {
        params: { userId: resolvedUserId },
      });

      return normalizeSubscriptionStatus(response.data);
    },
  });

  const createOrder = useMutation({
    mutationFn: async ({ uid, plan }: { uid?: any; plan: string }) => {
      const resolvedUserId = uid ? Number(uid) : await resolveBackendUserId();
      const response = await apiClient.post('/razorpay/create-order', null, {
        params: {
          userId: resolvedUserId,
          plan: String(plan).trim(),
        },
      });
      return normalizeRazorpayResponse(response.data);
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
    subscriptionRequest,
    subscriptionRespond,
    subscriptionStatus: subStatus.data,
    isLoadingStatus: subStatus.isLoading,
    isFetchingStatus: subStatus.isFetching,
    statusError: subStatus.error ? getApiErrorMessage(subStatus.error, 'Failed to load subscription status.') : null,
    refetchStatus: subStatus.refetch,
    createOrder,
    razorpayWebhook,

    useSubscriptionStatus: () => subStatus,
    subscriptionDetails: () => subStatus,
  };
};
