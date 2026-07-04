import apiClient from './apiClient';

export const telegramApi = {
  connect: async (userId: number, username: string) => {
    const response = await apiClient.post('/telegram/connect', null, {
      params: { userId, username },
    });
    return response.data;
  },

  disconnect: async (userId: number) => {
    const response = await apiClient.delete('/telegram/disconnect', {
      params: { userId },
    });
    return response.data;
  },

  getLink: async (userId: number) => {
    const response = await apiClient.get('/telegram/link', {
      params: { userId },
    });
    return response.data;
  },
};
