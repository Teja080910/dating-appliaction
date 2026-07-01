import apiClient from './apiClient';
import {
  SendRequestDTO,
  ActionRequestDTO,
  ConnectionRequest,
} from './types';

export const connectionsApi = {
  sendRequest: async (data: SendRequestDTO) => {
    const response = await apiClient.post('/connections/send', data);
    return response.data;
  },

  acceptRequest: async (data: ActionRequestDTO) => {
    const response = await apiClient.put('/connections/accept', data);
    return response.data;
  },

  declineRequest: async (data: ActionRequestDTO) => {
    const response = await apiClient.put('/connections/decline', data);
    return response.data;
  },

  cancelRequest: async (data: ActionRequestDTO) => {
    const response = await apiClient.put('/connections/cancel', data);
    return response.data;
  },

  getSentRequests: async (
    userId: number,
  ): Promise<ConnectionRequest[]> => {
    const response = await apiClient.get('/connections/sent', {
      params: { userId },
    });
    return response.data;
  },

  getReceivedRequests: async (
    userId: number,
  ): Promise<ConnectionRequest[]> => {
    const response = await apiClient.get('/connections/received', {
      params: { userId },
    });
    return response.data;
  },

  getConnections: async (userId: number): Promise<ConnectionRequest[]> => {
    const response = await apiClient.get('/connections/list', {
      params: { userId },
    });
    return response.data;
  },

  getConnectionStatus: async (user1: number, user2: number) => {
    const response = await apiClient.get('/connections/status', {
      params: { user1, user2 },
    });
    return response.data;
  },
};
