import { DeviceEventEmitter } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { getAbsoluteUrl, toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { isResolvedApiUserId } from '../utils/sessionState';
import { repairStoredSessionIdentity } from '../utils/session';

export const MAX_PROFILE_IMAGES = 6;

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

export const normalizeUserImagesResponse = (payload: unknown): NormalizedUserImage[] => {
  const images = resolveImageArray(payload)
    .map((image: any) => {
      if (typeof image === 'string') {
        const url = image.trim();
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
    .filter((image) => Boolean(image.imageUrl));

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

      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: photo.name || photo.fileName || `image_${Date.now()}.jpg`,
        type: photo.type || 'image/jpeg',
      } as any);

      const res = await apiClient.post('/profile/upload-image', formData, {
        params: normalizedUserId ? {userId: normalizedUserId} : undefined,
        /*headers: {
          'Content-Type': 'multipart/form-data',
        },*/
      });

      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['userImages', variables?.uid || userId],
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
            const res = await apiClient.get(`/profile/get`, { params: { userId: normalizedUserId } });
            payload = res.data;
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
      const validId = isNumeric ? parsedNum : rawId;

      const deleteParams: Record<string, any> = {};
      if (normalizedUserId) deleteParams.userId = normalizedUserId;
      if (candidateImageUrl) deleteParams.imageUrl = candidateImageUrl;

      const attempts: Array<() => Promise<any>> = [];
      if (isNumeric) {
        // Primary backend endpoint per specification: DELETE /images/{id}
        attempts.push(() => apiClient.delete(`/images/${validId}`, { params: deleteParams, data: deleteParams }));
      }
      if (normalizedUserId && isNumeric) {
        attempts.push(() => apiClient.delete(`/users/${normalizedUserId}/images/${validId}`, { params: deleteParams, data: deleteParams }));
      }
      if (isNumeric) {
        attempts.push(() => apiClient.delete(`/users/images/${validId}`, { params: deleteParams, data: deleteParams }));
      }
      attempts.push(() => apiClient.delete(`/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));
      if (normalizedUserId) {
        attempts.push(() => apiClient.delete(`/users/${normalizedUserId}/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));
        attempts.push(() => apiClient.delete(`/users/${normalizedUserId}/images`, { params: deleteParams, data: deleteParams }));
      }
      attempts.push(() => apiClient.delete(`/users/images/${encodeURIComponent(String(validId))}`, { params: deleteParams, data: deleteParams }));

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

      const res = await apiClient.put(`/users/${normalizedUserId}/profile-photo/${imageId}`);
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
