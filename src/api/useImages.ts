import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { getAbsoluteUrl, getNativeNetworkError, toApiUserId } from './apiClient';
import { getAuthToken, getUserId } from '../utils/sessionHelper';
import { decodeJwtPayload, isResolvedApiUserId } from '../utils/sessionState';
import { repairStoredSessionIdentity } from '../utils/session';

export const MAX_PROFILE_IMAGES = 6;

/**
 * Every profile photo goes through the same picker settings: full-resolution
 * captures (2-8 MB) are what make the multipart body fail in transit.
 */
export const UPLOAD_PHOTO_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.7 as const,
  maxWidth: 1080,
  maxHeight: 1440,
};

export interface ServerUserImage {
  id?: number;
  imageUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  profile?: boolean | null;
}

export interface NormalizedUserImage {
  id: number | null;
  imageUrl: string | null;
  isProfile: boolean;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
}

const getBearerSubject = (token: string | null | undefined): string | null => {
  const payload = decodeJwtPayload(token);
  const subject = payload?.sub ?? payload?.subject ?? payload?.userId ?? null;
  const clean = subject === null || subject === undefined ? '' : String(subject).trim();
  return clean || null;
};

const resolveImageArray = (payload: unknown): ServerUserImage[] => {
  if (Array.isArray(payload)) {
    return payload as ServerUserImage[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      return record.data as ServerUserImage[];
    }

    const nestedData = record.data as Record<string, unknown> | null;
    if (nestedData && typeof nestedData === 'object') {
      if (Array.isArray(nestedData.images)) return nestedData.images as ServerUserImage[];
      if (Array.isArray(nestedData.userImages)) return nestedData.userImages as ServerUserImage[];
      if (Array.isArray(nestedData.photos)) return nestedData.photos as ServerUserImage[];
      if (nestedData.imageUrl || nestedData.url || nestedData.profileImageUrl) {
        return [nestedData as ServerUserImage];
      }
    }

    if (Array.isArray(record.images)) {
      return record.images as ServerUserImage[];
    }

    if (Array.isArray(record.userImages)) {
      return record.userImages as ServerUserImage[];
    }

    if (Array.isArray(record.photos)) {
      return record.photos as ServerUserImage[];
    }

    if (Array.isArray(record.content)) {
      return record.content as ServerUserImage[];
    }

    if (record.imageUrl || record.url || record.uri || record.path || record.profileImageUrl) {
      return [record as ServerUserImage];
    }
  }

  return [];
};

const isLikelyValidUrl = (u: string | null | undefined): boolean => {
  if (!u) return false;
  const str = u.trim();
  if (!str) return false;
  const lower = str.toLowerCase();
  if (lower.includes('success') || lower.includes('failed') || lower.includes('error') || lower.includes('done')) {
    return false;
  }
  return (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/') ||
    str.startsWith('file://') ||
    str.startsWith('content://') ||
    /\.(jpg|jpeg|png|webp|gif)/i.test(str)
  );
};

const toNumericId = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() && !isNaN(Number(value))) {
    return Number(value);
  }
  return null;
};

/**
 * Upload endpoints answer with:
 * { status, message, imageUrl, data: { id, imageUrl, isProfile, slotIndex } }
 * Older/partial builds answered with just the image URL, so accept both shapes.
 */
export const parseUploadResponse = (
  payload: unknown
): { id: number | null; imageUrl: string | null } => {
  if (typeof payload === 'string') {
    const text = payload.trim();
    return { id: null, imageUrl: isLikelyValidUrl(text) ? getAbsoluteUrl(text) : null };
  }

  if (!payload || typeof payload !== 'object') {
    return { id: null, imageUrl: null };
  }

  const root = payload as Record<string, any>;
  const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, any>) : null;
  const rawUrl = data?.imageUrl ?? root.imageUrl ?? data?.url ?? root.url ?? null;
  const rawId = data?.id ?? root.id ?? data?.imageId ?? root.imageId ?? null;
  const cleanUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  return {
    id: toNumericId(rawId),
    imageUrl: cleanUrl && isLikelyValidUrl(cleanUrl) ? getAbsoluteUrl(cleanUrl) : null,
  };
};

/**
 * Returns the backend's own reason for a rejected image request (selfie
 * verification, photo limit, ownership violation, malformed multipart...)
 * so the UI can show it verbatim instead of a generic failure message.
 */
export const getUploadErrorMessage = (error: any): string | null => {
  const raw =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    (typeof error?.response?.data === 'string' ? error.response.data : null) ??
    null;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (message) return message;

  // Below-HTTP failures: the native IOException text (see getNativeNetworkError).
  return getNativeNetworkError(error);
};

const getRejectionText = (error: any): string => {
  const data = error?.response?.data;
  return String(data?.message || data?.error || (typeof data === 'string' ? data : '')).trim();
};

/**
 * The upload endpoint answers "Photo rejected." / BAD_REQUEST when the server's
 * face check refuses the image. The text carries no usable reason, so the UI
 * replaces it with guidance instead of showing the raw string.
 */
export const isGenericPhotoRejection = (error: any): boolean => {
  if (Number(error?.response?.status) !== 400) return false;
  const message = getRejectionText(error).toLowerCase();
  return (
    message === 'photo rejected.' ||
    message === 'photo rejected' ||
    message === 'invalid image' ||
    message === 'bad request'
  );
};

export const isSelfieMismatch = (error: any): boolean => {
  if (Number(error?.response?.status) !== 400) return false;
  const message = getRejectionText(error).toLowerCase();
  return message.includes('does not match') || message.includes('not the same person');
};

export type PhotoRejectionKind = 'no_face' | 'selfie_mismatch' | 'verification_unavailable';

/**
 * Maps a rejected upload to the guidance the user must see. The rules are:
 * the first photo only has to be a real, clearly visible human face; every
 * photo after that must additionally be the person from the verified selfie.
 */
export const getPhotoRejectionKind = (
  error: any,
  { isPrimary = false }: { isPrimary?: boolean } = {},
): PhotoRejectionKind | null => {
  const status = Number(error?.response?.status);
  const message = getRejectionText(error).toLowerCase();

  if (
    status === 503 ||
    message.includes('verification is temporarily unavailable') ||
    message.includes('temporarily unavailable')
  ) {
    return 'verification_unavailable';
  }

  if (isSelfieMismatch(error)) {
    return 'selfie_mismatch';
  }

  if (isGenericPhotoRejection(error)) {
    // A generic refusal on the first photo means no usable face was detected.
    // On later photos it means the face did not match the verified selfie.
    return isPrimary ? 'no_face' : 'selfie_mismatch';
  }

  if (status === 400 && (message.includes('no face') || message.includes('face not detected'))) {
    return 'no_face';
  }

  return null;
};

/**
 * Title/body to show for a rejected photo. Kept here so Edit Profile and
 * onboarding phrase the same reason identically.
 */
export const getPhotoRejectionCopy = (
  kind: PhotoRejectionKind,
  translate: (key: string, options?: { defaultValue?: string }) => string = (key, options) =>
    options?.defaultValue ?? key,
): { title: string; message: string } => {
  if (kind === 'no_face') {
    return {
      title: translate('profile.uploadimage.photo_no_face_title', {
        defaultValue: 'No Face Detected',
      }),
      message: translate('profile.uploadimage.photo_no_face_desc', {
        defaultValue:
          'Your first photo must clearly show a real human face. Avoid group shots, filters, sunglasses and heavy shadows, then try again.',
      }),
    };
  }

  if (kind === 'verification_unavailable') {
    return {
      title: translate('profile.uploadimage.photo_verify_unavailable_title', {
        defaultValue: 'Verification Unavailable',
      }),
      message: translate('profile.uploadimage.photo_verify_unavailable_desc', {
        defaultValue:
          'Face verification is temporarily unavailable, so your photo could not be checked. Please try again in a few minutes.',
      }),
    };
  }

  return {
    title: translate('profile.uploadimage.photo_not_same_person_title', {
      defaultValue: 'Not the Same Person',
    }),
    message: translate('profile.uploadimage.photo_not_same_person_desc', {
      defaultValue:
        'This photo does not match your verified selfie. Every photo on your profile must be of you. Upload a clear photo of the same person shown in your selfie.',
    }),
  };
};

export const normalizeUserImagesResponse = (payload: unknown): NormalizedUserImage[] => {
  const images = resolveImageArray(payload)
    .map((image: any) => {
      if (typeof image === 'string') {
        const url = image.trim();
        if (!isLikelyValidUrl(url)) return null;
        return {
          id: null,
          imageUrl: url ? getAbsoluteUrl(url) : null,
          isProfile: false,
          fileName: null,
          fileType: null,
          fileSize: null,
          uploadedAt: null,
        };
      }
      const rawUrl =
        image?.imageUrl ||
        image?.url ||
        image?.uri ||
        image?.path ||
        image?.photoUrl ||
        image?.profileImageUrl ||
        image?.image ||
        null;
      const cleanUrl = typeof rawUrl === 'string' ? rawUrl.trim() : null;
      if (!isLikelyValidUrl(cleanUrl)) {
        return null;
      }
      const rawId = image?.id ?? image?.imageId;
      const parsedId =
        typeof rawId === 'number'
          ? rawId
          : rawId && !isNaN(Number(rawId))
          ? Number(rawId)
          : null;

      return {
        id: parsedId,
        imageUrl: cleanUrl ? getAbsoluteUrl(cleanUrl) : null,
        isProfile: Boolean(image?.profile || image?.isProfile || image?.isPrimary),
        fileName: image?.fileName ?? null,
        fileType: image?.fileType ?? null,
        fileSize: typeof image?.fileSize === 'number' ? image.fileSize : null,
        uploadedAt: image?.uploadedAt ?? null,
      };
    })
    .filter((image): image is NormalizedUserImage => Boolean(image && image.imageUrl));

  const profileImages = images.filter((image) => image.isProfile);
  const remainingImages = images.filter((image) => !image.isProfile);

  return [...profileImages, ...remainingImages];
};

export const mapImagesToSlots = (payload: unknown, slotCount = MAX_PROFILE_IMAGES) => {
  const normalized = normalizeUserImagesResponse(payload);
  const slots: (string | null)[] = Array(slotCount).fill(null);
  const imageIdByIndex: Record<number, number> = {};

  normalized.slice(0, slotCount).forEach((image, index) => {
    slots[index] = image.imageUrl;
    if (image.id !== null && image.id !== undefined && !isNaN(Number(image.id))) {
      imageIdByIndex[index] = Number(image.id);
    }
  });

  return {
    normalized,
    slots,
    imageIdByIndex,
    profileImageUrl:
      normalized.find((image) => image.isProfile)?.imageUrl ||
      normalized[0]?.imageUrl ||
      null,
  };
};

export const useUserImages = (userId?: string) => {
  const resolveUserId = async (candidate?: string) => {
    let activeId = candidate || userId || (await getUserId());

    if (!activeId || !isResolvedApiUserId(activeId)) {
      const repairedId = await repairStoredSessionIdentity();
      if (repairedId) activeId = repairedId;
    }

    return activeId ? toApiUserId(activeId) : null;
  };
  const queryClient = useQueryClient();

  const uploadImage = useMutation({
    mutationFn: async ({photo, uid}: {photo: any; uid?: string}) => {
      const normalizedUserId = await resolveUserId(uid);

      const fileName = photo.name || photo.fileName || `photo_${Date.now()}.jpg`;
      const fileType = photo.type || 'image/jpeg';
      const filePayload = {
        uri: photo.uri,
        name: fileName,
        type: fileType,
      };

      // POST /users/{userId}/images does not exist. The backend resolves the
      // account from the bearer token, so userId is only sent when it provably
      // matches the token's subject — a stale cached id is what produced
      // 403 PROFILE_OWNERSHIP_VIOLATION.
      const tokenSubject = getBearerSubject(await getAuthToken().catch(() => null));
      const trustedUserId =
        tokenSubject && normalizedUserId && String(tokenSubject) === String(normalizedUserId)
          ? String(normalizedUserId)
          : null;

      const formData = new FormData();
      formData.append('photo', filePayload as any);
      if (trustedUserId) {
        formData.append('userId', trustedUserId);
      }

      const selfieVerifiedFlag =
        (await AsyncStorage.getItem('@selfie_verified').catch(() => null)) === 'true';

      console.log('[upload-image] sending', {
        userId: trustedUserId || 'from-token',
        tokenSubject,
        cachedUserId: normalizedUserId,
        selfieVerifiedFlag,
        uri: filePayload.uri,
        name: filePayload.name,
        type: filePayload.type,
        fileSize: photo.fileSize ?? photo.size ?? null,
      });

      const res = await apiClient.post('/profile/upload-image', formData, {
        ...(trustedUserId ? { params: { userId: trustedUserId } } : {}),
        // Photo payloads are far larger than JSON calls; the 30s default
        // times out on slow networks.
        timeout: 60000,
      });
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['userImages', variables?.uid || userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['myProfile'],
      });
    },
  });

  /*const useGetImages = (uid?: string) =>
    useQuery({
      queryKey: ['userImages', uid],
      enabled: !!uid,
      queryFn: async () => {
        const normalizedUserId = await resolveUserId(uid);
        if (!normalizedUserId) throw new Error('UserId not resolved');

        const res = await apiClient.post(`/profile/me`, null, { params: { userId: normalizedUserId } });
        return normalizeUserImagesResponse(res.data);
      },
    });*/

  const getAllImages = useMutation({
    mutationFn: async (id?: string) => {
      const normalizedUserId = await resolveUserId(id);

      if (!normalizedUserId) {
        throw new Error('UserId not resolved');
      }

      let payload: any = null;
      try {
        const res = await apiClient.get(`/users/${normalizedUserId}/images`);
        payload = res.data;
      } catch (e1) {
        try {
          const res = await apiClient.get(`/images/users/${normalizedUserId}`);
          payload = res.data;
        } catch (e2) {
          try {
            const res = await apiClient.get(`/images/${normalizedUserId}`);
            payload = res.data;
          } catch (e3) {
            try {
              const res = await apiClient.get(`/profile/get`, { params: { userId: normalizedUserId } });
              payload = res.data;
            } catch (e4) {
              try {
                const res = await apiClient.post(`/profile/me`, null, { params: { userId: normalizedUserId } });
                payload = res.data;
              } catch (e5) {
                try {
                  const res = await apiClient.get(`/profile/me/${normalizedUserId}`);
                  payload = res.data;
                } catch (e6) {
                  payload = null;
                }
              }
            }
          }
        }
      }

      return normalizeUserImagesResponse(payload);
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (
      input: number | string | { imageId: number | string; userId?: string; imageUrl?: string }
    ) => {
      const rawId = typeof input === 'object' && input !== null ? input.imageId : input;
      const candidateUid = typeof input === 'object' && input !== null ? input.userId : undefined;
      const candidateImageUrl = typeof input === 'object' && input !== null ? input.imageUrl : undefined;
      const normalizedUserId = await resolveUserId(candidateUid);
      const parsedNum = Number(rawId);
      const isNumeric = Number.isFinite(parsedNum) && parsedNum > 0;

      let numericImageId = isNumeric ? parsedNum : null;

      // If ID is not numeric but we have the imageUrl, look up true ID from /users/{userId}/images
      if (!numericImageId && normalizedUserId && candidateImageUrl) {
        try {
          const res = await apiClient.get(`/users/${normalizedUserId}/images`);
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.images) ? res.data.images : []);
          const candFilename = candidateImageUrl.substring(candidateImageUrl.lastIndexOf('/') + 1);
          const isGeneric = ['photo.jpg', 'image.jpg', 'default.jpg'].includes(candFilename.toLowerCase());
          const found = list.find((img: any) => {
            const u = String(img?.imageUrl || img?.url || '');
            if (u === candidateImageUrl || getAbsoluteUrl(u) === getAbsoluteUrl(candidateImageUrl)) return true;
            const uFile = u.substring(u.lastIndexOf('/') + 1);
            if (!isGeneric && candFilename && uFile && candFilename === uFile) return true;
            return false;
          });
          if (found?.id && !isNaN(Number(found.id))) {
            numericImageId = Number(found.id);
          }
        } catch {}
      }

      const validId = numericImageId ?? (isNumeric ? parsedNum : rawId);

      const deleteParams: Record<string, any> = {};
      if (normalizedUserId) deleteParams.userId = normalizedUserId;
      if (candidateImageUrl) deleteParams.imageUrl = candidateImageUrl;

      const attempts: Array<() => Promise<any>> = [];
      if (numericImageId) {
        // Primary backend endpoint per OpenAPI / Swagger: DELETE /users/images/{imageId}
        attempts.push(() => apiClient.delete(`/users/images/${numericImageId}`));
        if (normalizedUserId) {
          attempts.push(() => apiClient.delete(`/users/${normalizedUserId}/images/${numericImageId}`));
        }
        attempts.push(() => apiClient.delete(`/images/${numericImageId}`, { params: deleteParams, data: deleteParams }));
      } else {
        attempts.push(() => apiClient.delete(`/users/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));
        if (normalizedUserId) {
          attempts.push(() => apiClient.delete(`/users/${normalizedUserId}/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));
        }
        attempts.push(() => apiClient.delete(`/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));
      }

      let lastError: any = null;
      for (const attempt of attempts) {
        try {
          const res = await attempt();
          return res.data;
        } catch (err: any) {
          lastError = err;
        }
      }
      throw lastError;
    },
    onSuccess: async (_, variables) => {
      const candidateUid = typeof variables === 'object' && variables !== null ? variables.userId : undefined;
      await queryClient.invalidateQueries({
        queryKey: ['userImages'],
      });
      if (candidateUid || userId) {
        await queryClient.invalidateQueries({
          queryKey: ['userImages', candidateUid || userId],
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ['myProfile'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['profile-me'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['profile'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['connections'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['connections-received'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['connections-sent'],
      });
      DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
      DeviceEventEmitter.emit('AMARA_CONNECTION_UPDATED');
    },
  });

  const setProfilePhoto = useMutation({
    mutationFn: async ({ uid, imageId }: { uid?: string; imageId: number }) => {
      const normalizedUserId = await resolveUserId(uid);
      if (!normalizedUserId) {
        throw new Error('Unable to resolve backend userId for profile photo.');
      }

      // Backend expects the string user code (SA1000) plus the numeric image id
      // from GET /users/{userId}/images.
      const numericImageId = Number(imageId);
      if (!Number.isFinite(numericImageId) || numericImageId <= 0) {
        throw new Error('Invalid image id for profile photo.');
      }

      const res = await apiClient.put(`/users/${normalizedUserId}/profile-photo/${numericImageId}`);
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['userImages', variables?.uid || userId],
      });
    },

  });



  const getSafeUserId = async (uid?: string) => {
    const id = await resolveUserId(uid);
    if (!id) throw new Error('UserId not resolved');
    return id;
  };

  const imagesQuery = useQuery({
    queryKey: ['userImages', userId],
    enabled: false,
    queryFn: async () => {
      const id = await getSafeUserId(userId);
      const res = await apiClient.post(`/profile/me`, null, { params: { userId: id } });
      return normalizeUserImagesResponse(res.data);
    },
  });

  return {
    uploadImage,
    imagesQuery,
    getAllImages,
    deleteImage,
    setProfilePhoto,
  };
};
