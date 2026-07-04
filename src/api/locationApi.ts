import apiClient from './apiClient';

export const locationApi = {
  add: async (data: { userId: string; city: string; state: string; country: string; lat: number; lng: number }) => {
    const response = await apiClient.post('/location/add', data);
    return response.data;
  },

  switchLocation: async (userId: string, locationId: number) => {
    const response = await apiClient.put('/location/switch', null, {
      params: { userId, locationId },
    });
    return response.data;
  },

  current: async (userId: string) => {
    const response = await apiClient.get(`/location/current/${userId}`);
    return response.data;
  },

  history: async (userId: number) => {
    const response = await apiClient.get(`/location/history/${userId}`);
    return response.data;
  },

  getNearbyUsers: async (userId: string, radius: number = 100) => {
    const response = await apiClient.get('/location/nearby', {
      params: { userId, radius },
    });
    return response.data;
  },
};
