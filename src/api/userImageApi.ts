import apiClient from './apiClient';

export const userImageApi = {
  uploadImage: async (userId: string, image: any) => {
    const formData = new FormData();
    formData.append('image', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || 'photo.jpg',
    } as any);
    const response = await apiClient.post(`/users/${userId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAllImages: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/images`);
    return response.data;
  },

  setProfilePhoto: async (userId: string, imageId: number) => {
    const response = await apiClient.put(`/users/${userId}/profile-photo/${imageId}`);
    return response.data;
  },

  deleteImage: async (imageId: number) => {
    const response = await apiClient.delete(`/users/images/${imageId}`);
    return response.data;
  },
};
