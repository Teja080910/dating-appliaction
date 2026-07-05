import apiClient from './apiClient';

export const accountApi = {
  deactivate: async (userId: number) => {
    const response = await apiClient.post('/account/deactivate', null, {
      params: { userId },
    });
    return response.data;
  },

  hardDelete: async (userId: number) => {
    const response = await apiClient.delete('/account/delete', {
      params: { userId },
    });
    return response.data;
  },
};
