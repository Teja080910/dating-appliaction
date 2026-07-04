import { authApi } from './authApi';
import { LoginRequest } from './types';

export const loginUserApi = async (data: LoginRequest) => {
  try {
    const response = await authApi.login(data);
    return response;
  } catch (error) {
    throw error;
  }
};
