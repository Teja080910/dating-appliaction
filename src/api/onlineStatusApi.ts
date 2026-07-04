import apiClient from './apiClient';

export const onlineStatusApi = {
  setOnline: async (userId: string) => {
    const response = await apiClient.put('/status/online', null, {
      params: { userId },
    });
    return response.data;
  },

  setOffline: async (userId: string) => {
    const response = await apiClient.put('/status/offline', null, {
      params: { userId },
    });
    return response.data;
  },
};
