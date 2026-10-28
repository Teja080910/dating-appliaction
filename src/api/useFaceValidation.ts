import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FACE_VALIDATION_URL } from '../environment/ApiConfig';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession } from '../utils/session';

export interface FaceValidationHealthResponse {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface UserFaceStatusResponse {
  exists?: boolean;
  live_photo_present?: boolean;
  created_at?: string;
  user_id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface UserPhotosResponse {
  live_photo?: string | null;
  verification_photos?: string[];
  [key: string]: unknown;
}

export const faceValidationClient = axios.create({
  baseURL: FACE_VALIDATION_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

export const checkFaceValidationHealth = async (): Promise<FaceValidationHealthResponse> => {
  try {
    const res = await faceValidationClient.get('/health');
    return res.data;
  } catch (error: any) {
    console.warn('[FaceValidation] Health check failed:', error?.message || error);
    return { status: 'offline', message: error?.message || 'Service offline' };
  }
};

export const getUserFaceStatus = async (userId: string | number): Promise<UserFaceStatusResponse> => {
  const cleanId = String(userId).trim();
  const res = await faceValidationClient.get(`/user_status/${encodeURIComponent(cleanId)}`);
  return res.data;
};

export const getUserPhotos = async (userId: string | number): Promise<UserPhotosResponse> => {
  const cleanId = String(userId).trim();
  const res = await faceValidationClient.post('/get_user_photos', {
    user_id: cleanId,
  });
  return res.data;
};

export interface UploadLivePhotoParams {
  userId?: string | number;
  photoUri: string;
  fileName?: string;
  mimeType?: string;
}

export const uploadLivePhotoApi = async ({
  userId,
  photoUri,
  fileName,
  mimeType = 'image/jpeg',
}: UploadLivePhotoParams) => {
  let resolvedUserId: string | number | null | undefined = userId;
  if (!resolvedUserId) {
    resolvedUserId = await getUserId().catch(() => null);
  }
  if (!resolvedUserId) {
    const session = await getAuthSession();
    resolvedUserId = session?.userId;
  }

  const cleanUserId = String(resolvedUserId || 'anonymous');
  const cleanUri = photoUri.startsWith('file://') ? photoUri : `file://${photoUri}`;
  const name = fileName || `selfie_${cleanUserId}_${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append('user_id', cleanUserId);
  formData.append('photo', {
    uri: cleanUri,
    name,
    type: mimeType,
  } as any);

  console.log(`[FaceValidation] Uploading live photo for user ${cleanUserId}...`);
  try {
    const res = await faceValidationClient.post('/upload_live_photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data && (res.data.success === false || res.data.error)) {
      throw new Error(res.data.error || res.data.message || 'Face validation failed');
    }

    return res.data;
  } catch (error: any) {
    const serverMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Face validation failed';
    console.warn('[FaceValidation] Live photo rejected by AI:', serverMessage);
    const enrichedError = new Error(serverMessage);
    (enrichedError as any).response = error?.response;
    throw enrichedError;
  }
};

export interface UploadVerificationPhotosParams {
  userId?: string | number;
  photoUris: string[];
}

export const uploadVerificationPhotosApi = async ({
  userId,
  photoUris,
}: UploadVerificationPhotosParams) => {
  let resolvedUserId: string | number | null | undefined = userId;
  if (!resolvedUserId) {
    resolvedUserId = await getUserId().catch(() => null);
  }
  if (!resolvedUserId) {
    const session = await getAuthSession();
    resolvedUserId = session?.userId;
  }

  const cleanUserId = String(resolvedUserId || 'anonymous');
  const validUris = photoUris.filter((uri) => typeof uri === 'string' && uri.trim().length > 0);

  if (validUris.length === 0) {
    return { status: 'skipped', message: 'No photos to upload' };
  }

  const formData = new FormData();
  formData.append('user_id', cleanUserId);

  validUris.forEach((uri, index) => {
    const cleanUri =
      uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
    const fileObj = {
      uri: cleanUri,
      name: `verification_${cleanUserId}_${index}_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any;
    // Backend Python service expects 'photos'
    formData.append('photos', fileObj);
    formData.append('photos[]', fileObj);
  });

  console.log(`[FaceValidation] Uploading ${validUris.length} verification photos for user ${cleanUserId}...`);
  try {
    const res = await faceValidationClient.post('/upload_verification_photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data && (res.data.success === false || res.data.error)) {
      throw new Error(res.data.error || res.data.message || 'Verification photos upload failed');
    }

    return res.data;
  } catch (error: any) {
    const serverMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Verification photos upload failed';
    console.warn('[FaceValidation] Verification photos rejected by AI:', serverMessage);
    const enrichedError = new Error(serverMessage);
    (enrichedError as any).response = error?.response;
    throw enrichedError;
  }
};

export const useFaceValidation = () => {
  const healthQuery = useQuery({
    queryKey: ['face-validation-health'],
    queryFn: checkFaceValidationHealth,
    staleTime: 60000,
    retry: 1,
  });

  const uploadLivePhotoMutation = useMutation({
    mutationFn: uploadLivePhotoApi,
    onError: (err: any) => {
      console.warn('[FaceValidation] Live photo upload failed:', err?.message || err);
    },
  });

  const uploadVerificationPhotosMutation = useMutation({
    mutationFn: uploadVerificationPhotosApi,
    onError: (err: any) => {
      console.warn('[FaceValidation] Verification photos upload failed:', err?.message || err);
    },
  });

  const checkUserStatus = useMutation({
    mutationFn: (userId: string | number) => getUserFaceStatus(userId),
  });

  const fetchUserPhotos = useMutation({
    mutationFn: (userId: string | number) => getUserPhotos(userId),
  });

  return {
    health: healthQuery.data,
    isHealthLoading: healthQuery.isLoading,
    refetchHealth: healthQuery.refetch,
    uploadLivePhoto: uploadLivePhotoMutation,
    uploadVerificationPhotos: uploadVerificationPhotosMutation,
    checkUserStatus,
    fetchUserPhotos,
  };
};
