import apiClient from './apiClient';
import {
  ProfileResponse,
  ProfileRequestDTO,
  GenderOrientationRequest,
  UpdateBasicDTO,
  UpdateDetailsDTO,
  UpdatePreferencesDTO,
  HomeResponse,
} from './types';

export const profileApi = {
  getMyProfile: async (userId: string): Promise<ProfileResponse> => {
    const response = await apiClient.post('/profile/me', null, {
      params: { userId },
    });
    return response.data;
  },

  setupProfile: async (
    userId: string,
    dto: ProfileRequestDTO,
    photo?: any,
  ) => {
    const formData = new FormData();
    if (photo) {
      formData.append('photo', photo);
    }
    const response = await apiClient.post(
      `/profile/${userId}/setup`,
      formData,
      {
        params: { dto: JSON.stringify(dto) },
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  },

  saveGenderOrientation: async (data: GenderOrientationRequest) => {
    const response = await apiClient.post('/profile/gender-orientation', data);
    return response.data;
  },

  updateBasic: async (data: UpdateBasicDTO) => {
    const response = await apiClient.put('/profile/update-basic', data);
    return response.data;
  },

  updateDetails: async (data: UpdateDetailsDTO) => {
    const response = await apiClient.put('/profile/update-details', data);
    return response.data;
  },

  updatePreferences: async (data: UpdatePreferencesDTO) => {
    const response = await apiClient.put('/profile/update-preferences', data);
    return response.data;
  },

  acceptTerms: async (userId: number) => {
    const response = await apiClient.post('/privacy/accept', null, {
      params: { userId },
    });
    return response.data;
  },

  getProfileCompletion: async (userId: string) => {
    const response = await apiClient.post('/profile/completion', null, {
      params: { userId },
    });
    return response.data;
  },

  uploadImage: async (userId: string, image: any) => {
    const formData = new FormData();
    formData.append('image', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || 'photo.jpg',
    } as any);
    const response = await apiClient.post('/profile/upload-image', formData, {
      params: { userId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  setProfilePhoto: async (userId: string, imageId: number) => {
    const response = await apiClient.put(
      `/users/${userId}/profile-photo/${imageId}`,
    );
    return response.data;
  },

  getMyUser: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  getHomeUsers: async (userId: string): Promise<HomeResponse> => {
    const response = await apiClient.get('/home/allusers', {
      params: { userId },
    });
    return response.data;
  },

  getAllImages: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/images`);
    return response.data;
  },

  deleteImage: async (imageId: number) => {
    const response = await apiClient.delete(`/users/images/${imageId}`);
    return response.data;
  },

  saveAllProfile: async (userId: string, dto: ProfileRequestDTO) => {
    const response = await apiClient.post(`/profile/${userId}/setup`, null, {
      params: { dto: JSON.stringify(dto) },
    });
    return response.data;
  },
};
