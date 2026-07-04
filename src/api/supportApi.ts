import apiClient from './apiClient';

export const supportApi = {
  createTicket: async (data: { userId: number; subject: string; message: string }) => {
    const response = await apiClient.post('/support/create', data);
    return response.data;
  },

  myTickets: async (userId: number) => {
    const response = await apiClient.get('/support/my', {
      params: { userId },
    });
    return response.data;
  },

  byStatus: async (status: string) => {
    const response = await apiClient.get('/support/status', {
      params: { status },
    });
    return response.data;
  },

  close: async (ticketId: number) => {
    const response = await apiClient.put(`/support/close/${ticketId}`);
    return response.data;
  },
};
