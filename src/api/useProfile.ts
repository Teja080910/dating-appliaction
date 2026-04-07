import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

const sanitizeProfileDto = (dto: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(dto || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

const createImageFormData = (key: string, photo: any) => {
  const formData = new FormData();
  formData.append(key, {
    uri: photo.uri,
    name: photo.name || photo.fileName || `${key}_${Date.now()}.jpg`,
    type: photo.type || 'image/jpeg',
  } as any);
  return formData;
};

const resolveProfilePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const nestedData = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  return nestedData || payload;
};

const normalizeProfile = (payload: any) => {
  const source = resolveProfilePayload(payload);

  return {
    id: typeof source?.id === 'number' ? source.id : null,
    name: source?.name ? String(source.name) : '',
    displayName: source?.displayName ? String(source.displayName) : '',
    email: source?.email ? String(source.email) : '',
    bio: source?.bio ? String(source.bio) : '',
    dob: source?.dob ? String(source.dob) : null,
    age: typeof source?.age === 'number' ? source.age : null,
    gender: source?.gender ? String(source.gender) : null,
    orientation: source?.orientation ? String(source.orientation) : null,
    language: source?.language ? String(source.language) : '',
    appearance: source?.appearance ? String(source.appearance) : '',
    bodyType: source?.bodyType ? String(source.bodyType) : '',
    height: typeof source?.height === 'number' ? source.height : 0,
    englishLevel: source?.englishLevel ? String(source.englishLevel) : '',
    ethnicity: source?.ethnicity ? String(source.ethnicity) : '',
    lookingFor: source?.lookingFor ? String(source.lookingFor) : '',
    smoke: source?.smoke ? String(source.smoke) : '',
    drink: source?.drink ? String(source.drink) : '',
    verifiedSelfie: Boolean(source?.verifiedSelfie ?? source?.selfieVerified),
    selfieVerified: Boolean(source?.selfieVerified ?? source?.verifiedSelfie),
    profileImageUrl: source?.profileImageUrl ? String(source.profileImageUrl) : null,
    images: Array.isArray(source?.images) ? source.images : [],
    raw: payload,
  };
};

const normalizeCompletion = (payload: any) => {
  const source = resolveProfilePayload(payload);
  const numeric = Number(source);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  const nestedNumeric = Number(source?.completion ?? source?.percentage ?? source?.progress);
  return Number.isFinite(nestedNumeric) ? nestedNumeric : 0;
};

const profileQueryKey = () => ['myProfile'];
const completionQueryKey = () => ['profileCompletion'];

export const useProfile = () => {
  const queryClient = useQueryClient();
  const resolveBackendUserId = async () => {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return Number(userId);
  };

  const resolveNumericUserId = async (candidate?: any) => {
    if (candidate !== undefined && candidate !== null && String(candidate).trim() !== '') {
      return Number(candidate);
    }

    return resolveBackendUserId();
  };

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: profileQueryKey() });
    await queryClient.invalidateQueries({ queryKey: completionQueryKey() });
  };

  const setupProfile = useMutation({
    mutationFn: async ({ uid, dto, photo }: { uid?: any; dto: any; photo?: any }) => {
      const normalizedDto = sanitizeProfileDto(dto);
      const formData = new FormData();
      const resolvedUserId = uid ? Number(uid) : await resolveBackendUserId();

      if (photo?.uri) {
        formData.append('photo', {
          uri: photo.uri,
          name: photo.name || photo.fileName || `profile_${Date.now()}.jpg`,
          type: photo.type || 'image/jpeg',
        } as any);
      }

      const res = await apiClient.post(`/profile/${resolvedUserId}/setup`, formData, {
        params: normalizedDto,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    },
    onSuccess: async (_, variables) => {
      await invalidateProfile();
    },
  });

  const useMyProfile = (uid: any) =>
    useQuery({
      queryKey: profileQueryKey(),
      queryFn: async () => {
        const resolvedUserId = uid ? Number(uid) : await resolveBackendUserId();
        const res = await apiClient.get(`/profile/me/${resolvedUserId}`);
        return normalizeProfile(res.data);
      },
      staleTime: 1000 * 60 * 5,
    });

  const useProfileCompletion = (uid: any) =>
    useQuery({
      queryKey: completionQueryKey(),
      queryFn: async () => {
        const resolvedUserId = uid ? Number(uid) : await resolveBackendUserId();
        const res = await apiClient.get(`/profile/completion/${resolvedUserId}`);
        return normalizeCompletion(res.data);
      },
    });

  const updatePreferences = useMutation({
    mutationFn: async (data: { userId?: any; lookingFor: string; smoke: string; drink: string }) => {
      const resolvedUserId = await resolveNumericUserId(data.userId);
      const payload = {
        userId: resolvedUserId,
        lookingFor: data.lookingFor,
        smoke: data.smoke,
        drink: data.drink,
      };
      const res = await apiClient.put('/profile/update-preferences', payload, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  const updateDetails = useMutation({
    mutationFn: async (data: {
      userId?: any;
      language: string;
      bodyType: string;
      appearance: string;
      height: number;
    }) => {
      const resolvedUserId = await resolveNumericUserId(data.userId);
      const payload = {
        userId: resolvedUserId,
        language: data.language,
        bodyType: data.bodyType,
        appearance: data.appearance,
        height: data.height,
      };
      const res = await apiClient.put('/profile/update-details', payload, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  const updateBasic = useMutation({
    mutationFn: async (data: { userId?: any; displayName: string; bio: string; age: number }) => {
      const resolvedUserId = await resolveNumericUserId(data.userId);
      const payload = {
        userId: resolvedUserId,
        displayName: data.displayName,
        bio: data.bio,
        age: data.age,
      };
      const res = await apiClient.put('/profile/update-basic', payload, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  const uploadImage = useMutation({
    mutationFn: async ({ photo, uid }: { photo: any; uid?: any }) => {
      const formData = createImageFormData('image', photo);
      const resolvedUserId = await resolveNumericUserId(uid);

      const res = await apiClient.post('/profile/upload-image', formData, {
        params: { userId: resolvedUserId },
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
      await queryClient.invalidateQueries({ queryKey: ['userImages'] });
    },
  });

  const uploadSelfie = useMutation({
    mutationFn: async ({ photo, uid }: { photo: any; uid?: any }) => {
      const formData = createImageFormData('selfie', photo);
      const resolvedUserId = await resolveNumericUserId(uid);

      const res = await apiClient.post('/profile/selfie/upload', formData, {
        params: { userId: resolvedUserId },
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  const verifySelfie = useMutation({
    mutationFn: async (uid: any) => {
      const resolvedUserId = await resolveNumericUserId(uid);
      // Swagger: PUT /profile/selfie/verify/{userId} — userId is a PATH param
      const res = await apiClient.put(`/profile/selfie/verify/${resolvedUserId}`);
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  const genderOrientation = useMutation({
    mutationFn: async (data: { userId?: any; gender: string; orientation: string }) => {
      const body = {
        ...(data.userId ? { userId: Number(data.userId) } : {}),
        gender: data.gender,
        orientation: data.orientation,
      };
      const res = await apiClient.post('/profile/gender-orientation', body, {
        params: data.userId ? { userId: Number(data.userId) } : undefined,
      });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  return {
    useMyProfile,
    useProfileCompletion,
    getMyProfile: useMyProfile,
    getUser: useMyProfile,
    setupProfile,
    updateUser: setupProfile,
    updatePreferences,
    updateDetails,
    useUpdateProfileDetails: updateDetails,
    updateBasic,
    genderOrientation,
    uploadImage,
    uploadSelfie,
    verifySelfie,
  };
};
