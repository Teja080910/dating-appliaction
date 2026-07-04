import apiClient from './apiClient';

export const razorpayApi = {
  createOrder: async (userId: number, plan: string) => {
    const response = await apiClient.post('/razorpay/create-order', null, {
      params: { userId, plan },
    });
    return response.data;
  },

  verifyPayment: async (orderId: string, paymentId: string, signature: string) => {
    const response = await apiClient.post('/razorpay/verify', null, {
      params: { orderId, paymentId, signature },
    });
    return response.data;
  },

  webhook: async (payload: string, signature: string) => {
    const response = await apiClient.post('/razorpay/webhook', payload, {
      headers: { 'X-Razorpay-Signature': signature, 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};
