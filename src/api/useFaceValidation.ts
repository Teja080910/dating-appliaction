import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FACE_VALIDATION_URL } from '../environment/ApiConfig';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession } from '../utils/session';
import apiClient from './apiClient';

export const SELFIE_VERIFICATION_URL_STORAGE_KEY = '@amara_selfie_verification_url';
export const DEFAULT_SELFIE_VERIFICATION_URL = (FACE_VALIDATION_URL || '')
  .trim()
  .replace(/\/+$/, '');

let activeFaceValidationUrl = DEFAULT_SELFIE_VERIFICATION_URL;

/**
 * Extract selfie verification URL from any API response or payload
 */
export const extractSelfieVerificationUrl = (payload: any): string | null => {
  if (!payload) return null;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.replace(/\/+$/, '');
    }
  }
  if (typeof payload === 'object') {
    const candidates = [
      payload.selfieVerification,
      payload.selfie_verification,
      payload.selfieVerificationUrl,
      payload.selfie_verification_url,
      payload.selfieUrl,
      payload.selfie_url,
      payload.faceValidationUrl,
      payload.face_validation_url,
      payload.faceVerificationUrl,
      payload.face_verification_url,
      payload.verificationUrl,
      payload.verification_url,
      payload.aiVerificationUrl,
      payload.ai_verification_url,
      payload.data?.selfieVerification,
      payload.data?.selfie_verification,
      payload.data?.selfieVerificationUrl,
      payload.data?.selfie_verification_url,
      payload.data?.selfieUrl,
      payload.data?.selfie_url,
      payload.data?.faceValidationUrl,
      payload.data?.face_validation_url,
      payload.data?.faceVerificationUrl,
      payload.data?.face_verification_url,
      payload.data?.verificationUrl,
      payload.data?.verification_url,
      payload.data?.aiVerificationUrl,
      payload.data?.ai_verification_url,
      payload.user?.selfieVerification,
      payload.user?.selfie_verification,
      payload.user?.selfieVerificationUrl,
      payload.user?.selfieUrl,
      payload.user?.faceValidationUrl,
      payload.user?.verificationUrl,
      payload.config?.selfieVerification,
      payload.config?.selfieVerificationUrl,
      payload.config?.faceValidationUrl,
    ];
    for (const cand of candidates) {
      if (typeof cand === 'string') {
        const trimmed = cand.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed.replace(/\/+$/, '');
        }
      }
    }
  }
  return null;
};

/**
 * Persist the selfie verification URL to local storage and memory
 */
export const saveSelfieVerificationUrl = async (url: string): Promise<void> => {
  if (!url || typeof url !== 'string') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return;
  activeFaceValidationUrl = clean;
  faceValidationClient.defaults.baseURL = clean;
  await AsyncStorage.setItem(SELFIE_VERIFICATION_URL_STORAGE_KEY, clean).catch(() => {});
  if (__DEV__) {
    console.log('📸 [FaceValidation] Active base URL updated to:', clean);
  }
};

/**
 * Retrieve the cached selfie verification URL
 */
export const getStoredSelfieVerificationUrl = async (): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(SELFIE_VERIFICATION_URL_STORAGE_KEY);
    if (stored && (stored.startsWith('http://') || stored.startsWith('https://'))) {
      const clean = stored.trim().replace(/\/+$/, '');
      activeFaceValidationUrl = clean;
      faceValidationClient.defaults.baseURL = clean;
      return clean;
    }
  } catch {}
  return null;
};

/**
 * Fetch dynamic selfie verification URL from backend endpoint or cached storage,
 * matching how fetchAmaraBotName works.
 */
export const fetchSelfieVerificationUrl = async (): Promise<string | null> => {
  // 1. Try dedicated endpoints if the backend exposes one (e.g. /selfie/verification-url)
  const candidateEndpoints = [
    '/selfie/verification-url',
    '/selfie-verification-url',
    '/selfie/url',
    '/verification/url',
    '/profile/selfie/url',
  ];
  for (const ep of candidateEndpoints) {
    try {
      const res = await apiClient.get(ep);
      const url = extractSelfieVerificationUrl(res?.data);
      if (url && !url.includes('ngrok-free.dev')) {
        await saveSelfieVerificationUrl(url);
        return url;
      }
    } catch {}
  }

  // 2. Return cached from AsyncStorage (filtering out dead ngrok URLs)
  const cached = await getStoredSelfieVerificationUrl();
  if (cached) {
    if (cached.includes('ngrok-free.dev')) {
      await AsyncStorage.removeItem(SELFIE_VERIFICATION_URL_STORAGE_KEY).catch(() => {});
    } else {
      return cached;
    }
  }

  // 3. Fallback to default if set and not ngrok
  if (DEFAULT_SELFIE_VERIFICATION_URL && !DEFAULT_SELFIE_VERIFICATION_URL.includes('ngrok-free.dev')) {
    return DEFAULT_SELFIE_VERIFICATION_URL;
  }

  return null;
};

/**
 * Hook to retrieve the dynamic Selfie Verification URL (same as useTelegramBotName).
 */
export const useSelfieVerificationUrl = () => {
  return useQuery({
    queryKey: ['selfie-verification-url'],
    queryFn: fetchSelfieVerificationUrl,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

/**
 * Checks whether an error from the face verification service represents
 * an offline service, dead ngrok tunnel, network timeout, or gateway failure,
 * rather than a genuine "face rejection" by an active AI model.
 */
export const isFaceServiceUnavailable = (err: any): boolean => {
  if (!err) return false;
  if (!err.response) return true;
  const status = Number(err.response?.status);
  // 404 (endpoint or dead ngrok tunnel), 502/503/504 (server gateway errors)
  if (status === 404 || status === 502 || status === 503 || status === 504) return true;
  // Ngrok specific headers
  const ngrokCode = err.response?.headers?.['ngrok-error-code'];
  if (ngrokCode) return true;
  const dataStr = typeof err.response?.data === 'string'
    ? err.response.data
    : JSON.stringify(err.response?.data || '');
  if (
    dataStr.includes('ERR_NGROK') ||
    dataStr.includes('ngrok-error-code') ||
    dataStr.includes('ngrok') ||
    dataStr.includes('Tunnel') ||
    dataStr.includes('502 Bad Gateway') ||
    dataStr.includes('<!DOCTYPE html>')
  ) {
    return true;
  }
  const msg = String(
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    ''
  ).toLowerCase();
  return (
    msg === 'network error' ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('failed to connect') ||
    msg.includes('connection refused')
  );
};

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
  baseURL: DEFAULT_SELFIE_VERIFICATION_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

// Dynamic baseURL interceptor: ensures each outgoing request uses the latest dynamic selfie verification URL
faceValidationClient.interceptors.request.use(async (config) => {
  try {
    const stored = await AsyncStorage.getItem(SELFIE_VERIFICATION_URL_STORAGE_KEY);
    if (stored && (stored.startsWith('http://') || stored.startsWith('https://'))) {
      const clean = stored.trim().replace(/\/+$/, '');
      activeFaceValidationUrl = clean;
      config.baseURL = clean;
    } else if (activeFaceValidationUrl) {
      config.baseURL = activeFaceValidationUrl;
    }
  } catch {}
  return config;
});

faceValidationClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    if (config && !config._retryCount) {
      const isNetworkError =
        !error.response ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error';
      if (isNetworkError) {
        config._retryCount = 1;
        console.log(`[FaceValidation] Retrying failed request to ${config.url}...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return faceValidationClient.request(config);
      }
    }
    return Promise.reject(error);
  }
);

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

  const fileObj = {
    uri: cleanUri,
    name,
    type: mimeType,
  } as any;

  const formData = new FormData();
  formData.append('user_id', cleanUserId);
  formData.append('photo', fileObj);
  formData.append('live_photo', fileObj);
  formData.append('file', fileObj);

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
    formData.append('files', fileObj);
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
