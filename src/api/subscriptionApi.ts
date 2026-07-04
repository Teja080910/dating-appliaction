import apiClient from './apiClient';

export const subscriptionApi = {
  activate: async (userId: string, plan: string) => {
    const response = await apiClient.post('/subscriber/activate', null, {
      params: { userId, plan },
    });
    return response.data;
  },

  getStatus: async (userId: string) => {
    const response = await apiClient.get('/subscriber/status', {
      params: { userId },
    });
    return response.data;
  },

  remainingDays: async (userId: string) => {
    const response = await apiClient.get('/subscriber/remaining-days', {
      params: { userId },
    });
    return response.data;
  },
};
