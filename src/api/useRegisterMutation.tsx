import { useMutation } from '@tanstack/react-query';
import { authApi } from './authApi';

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (data: {
      name: string;
      mobile: string;
      password: string;
      confirmPassword: string;
      gender: string;
    }) => authApi.register(data),
  });
};
