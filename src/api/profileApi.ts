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

// The /profile/{userId}/setup endpoint requires a multipart/form-data request
// (a plain JSON body 403s, even with a correct auth token) and expects each
// ProfileRequestDTO field as its own flattened query param, NOT a single
// JSON-stringified `dto` param — confirmed by live-testing both shapes
// against the deployed backend.
const buildSetupParams = (dto: ProfileRequestDTO): Record<string, string | number> => {
  const params: Record<string, string | number> = {};
  Object.entries(dto).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params[key] = value as string | number;
    }
  });
  return params;
};

export const profileApi = {
  getMyProfile: async (userId: string): Promise<ProfileResponse> => {
    const response = await apiClient.post('/profile/me', null, {
      params: { userId },
    });
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

  uploadSelfie: async (userId: number, image: any) => {
    const formData = new FormData();
    formData.append('selfie', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || 'selfie.jpg',
    } as any);
    const response = await apiClient.post('/profile/selfie/upload', formData, {
      params: { userId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  setProfilePhoto: async (userId: string, imageId: number) => {
    const response = await apiClient.put(`/users/${userId}/profile-photo/${imageId}`);
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

  saveAllProfile: async (userId: string, dto: ProfileRequestDTO, photo?: any) => {
    const formData = new FormData();
    if (photo) {
      formData.append('photo', photo);
    }
    const response = await apiClient.post(`/profile/${userId}/setup`, formData, {
      params: buildSetupParams(dto),
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
