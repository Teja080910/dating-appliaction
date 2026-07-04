import apiClient from './apiClient';

export const notificationApi = {
  push: async (data: Record<string, string>) => {
    const response = await apiClient.post('/notification/push', data);
    return response.data;
  },

  getAll: async (userId: number) => {
    const response = await apiClient.get('/notification', {
      params: { userId },
    });
    return response.data;
  },

  markRead: async (notificationId: number) => {
    const response = await apiClient.put('/notification/read', null, {
      params: { notificationId },
    });
    return response.data;
  },
};
