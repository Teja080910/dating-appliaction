import apiClient from './apiClient';

export const reportApi = {
  reportUser: async (data: { byUserId: number; targetUserId: number; reason: string; message?: string }) => {
    const response = await apiClient.post('/reports/report', data);
    return response.data;
  },

  myReports: async (userId: number) => {
    const response = await apiClient.get('/reports/my', {
      params: { userId },
    });
    return response.data;
  },

  reportsAgainstUser: async (userId: number) => {
    const response = await apiClient.get('/reports/against', {
      params: { userId },
    });
    return response.data;
  },

  resolve: async (reportId: number, data: { status: string }) => {
    const response = await apiClient.put(`/reports/resolve/${reportId}`, data);
    return response.data;
  },
};
