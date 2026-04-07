import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for Image Uploads (Onboarding)
 */
export const useUpload = () => {
  const queryClient = useQueryClient();

  const uploadImages = useMutation({
    mutationFn: async (_formData: FormData) => {
      throw new Error('Bulk upload endpoint is not documented in the current backend Swagger.');
    },
    onSuccess: (_data, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      console.error('Plural Upload Error:', err?.response?.data || err.message);
    }
  });

  return {
    uploadImages,
  };
};
