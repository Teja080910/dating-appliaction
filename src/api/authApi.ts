import apiClient from './apiClient';
import { RegisterRequest, LoginRequest, LoginResponse } from './types';

export const authApi = {
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/login', data);
    return response.data;
  },

  verifyRegisterOtp: async (data: Record<string, string>) => {
    const response = await apiClient.post('/verify-register/otp', data);
    return response.data;
  },

  sendOtp: async (data: { mobile: string; otp?: string }) => {
    const response = await apiClient.post('/auth/send-otp', data);
    return response.data;
  },

  verifyOtp: async (data: { userId: number; mobile: string; otp: string }) => {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  },

  sendForgotOtp: async (data: { mobile: string }) => {
    const response = await apiClient.post('/forgot-password/send-otp', data);
    return response.data;
  },

  resetPassword: async (data: { mobile: string; otp: string; newPassword: string }) => {
    const response = await apiClient.post('/forgot-password/reset', data);
    return response.data;
  },

  activateAccount: async (userId: number) => {
    const response = await apiClient.put('/account/activate', null, {
      params: { userId },
    });
    return response.data;
  },
};
