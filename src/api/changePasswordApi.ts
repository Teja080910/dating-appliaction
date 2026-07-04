import apiClient from './apiClient';

export const changePasswordApi = {
  changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/setting/change-password', null, {
      params: { userId, oldPassword, newPassword },
    });
    return response.data;
  },
};
