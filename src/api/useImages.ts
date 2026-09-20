import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { getAbsoluteUrl, toApiUserId } from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { isResolvedApiUserId } from '../utils/sessionState';
import { repairStoredSessionIdentity } from '../utils/session';

export const MAX_PROFILE_IMAGES = 5;

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
      return {
        id: typeof image?.id === 'number' ? image.id : (typeof image?.imageId === 'number' ? image.imageId : null),
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
    if (typeof image.id === 'number') {
      imageIdByIndex[index] = image.id;
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

      const res = await apiClient.get(`/users/${normalizedUserId}/images`);
      const payload = res.data;

      return normalizeUserImagesResponse(payload);
    },
  });



  const deleteImage = useMutation({
    mutationFn: async (imageId: number) => {
      const res = await apiClient.delete(`/users/images/${imageId}`);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['userImages', userId],
      });
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
