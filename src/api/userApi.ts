import apiClient from './apiClient';
import { UserFilterRequest, PageUser, SearchFilterRequest, UserSearchResponse } from './types';

export const userApi = {
  filterUsers: async (data: UserFilterRequest): Promise<PageUser> => {
    const response = await apiClient.post('/users/filter', data);
    return response.data;
  },

  searchUsers: async (data: SearchFilterRequest): Promise<UserSearchResponse[]> => {
    const response = await apiClient.post('/search', data);
    return response.data;
  },

  getNearbyUsers: async (userId: string, radius: number = 100) => {
    const response = await apiClient.get('/location/nearby', {
      params: { userId, radius },
    });
    return response.data;
  },
};
