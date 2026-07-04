import apiClient from './apiClient';

export const dashboardApi = {
  recent: async (page: number = 0, size: number = 10) => {
    const response = await apiClient.get('/dashboard/recent', {
      params: { page, size },
    });
    return response.data;
  },

  online: async (page: number = 0, size: number = 10) => {
    const response = await apiClient.get('/dashboard/online', {
      params: { page, size },
    });
    return response.data;
  },
};
