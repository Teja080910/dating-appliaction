import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export const useUpload = () => {
  const queryClient = useQueryClient();

  const uploadImages = useMutation({
    mutationFn: async ({ formData, userId }: any) => {
      formData.append('userId', userId);

      const res = await apiClient.post('/profile/upload-images', formData);
      return res.data;
    },

    onSuccess: async (_data, variables: any) => {
      await queryClient.invalidateQueries({ queryKey: ['myProfile', variables?.userId] });
      await queryClient.invalidateQueries({ queryKey: ['profileCompletion', variables?.userId] });
    },

    onError: (err: any) => {
      console.error('Upload Error:', err?.response?.data || err.message);
    },
  });

  return {
    uploadImages,
  };
};
