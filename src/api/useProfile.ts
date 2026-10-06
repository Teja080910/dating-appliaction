import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId } from '../utils/sessionHelper';

const allowedFields = [
  'name',
  'displayName',
  'email',
  'bio',
  'dob',
  'age',
  'gender',
  'orientation',
  'language',
  'appearance',
  'bodyType',
  'height',
  'englishLevel',
  'ethnicity',
  'lookingFor',
  'smoke',
  'drink',
];

const sanitizeProfileDto = (dto: Record<string, any>) =>
    Object.fromEntries(
        Object.entries(dto || {}).filter(
            ([key, value]) =>
                allowedFields.includes(key) &&
                value !== undefined &&
                value !== null &&
                value !== ''
        )
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
  const payloadSource = resolveProfilePayload(payload);
  // The API may return a flat profile, { profile }, or { user: { profile } }.
  // Flatten those compatible shapes so persisted values are not lost in the UI.
  const nestedUser = payloadSource?.user && typeof payloadSource.user === 'object'
    ? payloadSource.user
    : {};
  const nestedProfile = payloadSource?.profile && typeof payloadSource.profile === 'object'
    ? payloadSource.profile
    : (nestedUser?.profile && typeof nestedUser.profile === 'object'
      ? nestedUser.profile
      : {});
  const source = { ...nestedUser, ...nestedProfile, ...payloadSource };
  const numberOrZero = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  return {
    id: source?.id !== undefined && source?.id !== null ? Number(source.id) : null,
    userId: source?.userId !== undefined && source?.userId !== null
      ? String(source.userId)
      : (nestedUser?.id !== undefined && nestedUser?.id !== null ? String(nestedUser.id) : ''),
    name: source?.name ? String(source.name) : '',
    displayName: source?.displayName ? String(source.displayName) : '',
    email: source?.email ? String(source.email) : '',
    bio: source?.bio ? String(source.bio) : (source?.description ? String(source.description) : ''),
    dob: source?.dob ? String(source.dob) : null,
    age: source?.age !== undefined && source?.age !== null && source?.age !== ''
      ? numberOrZero(source.age)
      : null,
    gender: source?.gender ? String(source.gender) : null,
    orientation: source?.orientation ? String(source.orientation) : null,
    language: source?.language ? String(source.language) : '',
    appearance: source?.appearance ? String(source.appearance) : '',
    bodyType: source?.bodyType ? String(source.bodyType) : '',
    height: numberOrZero(source?.height),
    englishLevel: source?.englishLevel ? String(source.englishLevel) : '',
    ethnicity: source?.ethnicity ? String(source.ethnicity) : '',
    lookingFor: source?.lookingFor ? String(source.lookingFor) : '',
    smoke: source?.smoke ? String(source.smoke) : '',
    drink: source?.drink ? String(source.drink) : '',
    currentCity: source?.currentCity ? String(source.currentCity) : '',
    telegramUsername: source?.telegramUsername ? String(source.telegramUsername) : '',
    verifiedSelfie: Boolean(source?.verifiedSelfie ?? source?.selfieVerified),
    selfieVerified: Boolean(source?.selfieVerified ?? source?.verifiedSelfie),
    profileImageUrl: source?.profileImageUrl ? String(source.profileImageUrl) : (Array.isArray(source?.photos) && source.photos[0] ? String(source.photos[0]) : null),
    images: Array.isArray(source?.images) ? source.images : (Array.isArray(source?.photos) ? source.photos : []),
    photos: Array.isArray(source?.photos) ? source.photos : (Array.isArray(source?.images) ? source.images : []),
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

const hasValidUid = (uid: any): boolean =>
  uid !== undefined && uid !== null && String(uid).trim() !== '';

const resolveBackendUserId = async () => {
  const userId = await getUserId();
  if (!userId || String(userId).trim() === '') {
    throw new Error('User not logged in or userId missing');
  }
  return String(userId);
};

const resolveNumericUserId = async (candidate?: any) => {
  let userId = candidate;
  if (!userId || String(userId).trim() === '') {
    userId = await resolveBackendUserId();
  }
  const cleaned = String(userId).trim();
  if (!cleaned) {
    throw new Error(`Invalid userId format: ${userId}`);
  }
  return cleaned;
};

export const useMyProfile = (uid?: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    hasValidUid(uid) ? String(uid) : null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (hasValidUid(uid)) {
      setResolvedUserId(String(uid));
      return;
    }

    // No uid passed → fall back to the logged-in user's stored userId so the
    // profile still loads after logout/login (in-memory context is reset).
    getUserId()
      .then((id) => {
        if (!cancelled && id) setResolvedUserId(String(id));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!resolvedUserId) return;

    setLoading(true);
    setError(null);
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await apiClient.post(`/profile/me`, null, { params: { userId: resolvedUserId } });
        if (!cancelled) {
          setData(normalizeProfile(res.data));
        }
      } catch (err: any) {
        if (!cancelled) {
          setData(null);
          const message =
            err?.response?.data?.message ||
            (typeof err?.message === 'string' ? err.message : 'Failed to load profile');
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [resolvedUserId, refreshKey]);

  return { data, isLoading: loading, error, refetch };
};

export const useProfileCompletion = (uid: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!uid || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const resolvedUserId = uid ? String(uid) : await resolveBackendUserId();
        const res = await apiClient.post(`/profile/completion`, null, { params: { userId: resolvedUserId } });
        if (!cancelled) setData(normalizeCompletion(res.data));
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [uid]);

  return { data, isLoading: loading };
};

export const useProfile = () => {
  const queryClient = useQueryClient();

  const invalidateProfile = async (uid?: any) => {
    await queryClient.invalidateQueries({queryKey: ['myProfile', uid]});
    await queryClient.invalidateQueries({queryKey: ['profileCompletion', uid]});
  };

  type SetupProfileInput = {
    uid?: any;
    dto: Record<string, any>;
    photo?: any;
  };

  const setupProfile = useMutation<any, Error, SetupProfileInput>({
    mutationFn: async ({uid, dto, photo}) => {
      const normalizedDto = sanitizeProfileDto(dto);

      let resolvedName = normalizedDto.name || normalizedDto.displayName;
      if (!resolvedName) {
        resolvedName =
          (await AsyncStorage.getItem('name')) ||
          (await AsyncStorage.getItem('displayName')) ||
          (await AsyncStorage.getItem('userName')) ||
          'User';
      }
      normalizedDto.name = resolvedName;
      if (!normalizedDto.displayName) {
        normalizedDto.displayName = resolvedName;
      }

      const resolvedUserId = await resolveNumericUserId(uid);
      console.log('📡 API userId:', resolvedUserId);

      const formData = new FormData();

      Object.entries(normalizedDto).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      if (photo?.uri) {
        formData.append('photo', {
          uri: photo.uri,
          name: photo.name || `profile_${Date.now()}.jpg`,
          type: photo.type || 'image/jpeg',
        } as any);
      }

      const res = await apiClient.post(
        `/profile/${resolvedUserId}/setup`,
        formData,
        { params: { dto: JSON.stringify(normalizedDto) } },
      );

      return res.data;
    },
  });

  type UpdatePreferencesInput = {
    userId?: any;
    lookingFor: string;
    smoke: string;
    drink: string;
  };

  const updatePreferences = useMutation<any, Error, UpdatePreferencesInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload = {
        userId: resolvedUserId,
        lookingFor: data.lookingFor,
        smoke: data.smoke,
        drink: data.drink,
      };

      const res = await apiClient.put('/profile/update-preferences', payload);
      return res.data;
    },
  });

  type UpdateDetailsInput = {
    userId?: any;
    language: string;
    bodyType: string;
    appearance: string;
    height: number;
    englishLevel?: string;
    ethnicity?: string;
  };

  const updateDetails = useMutation<any, Error, UpdateDetailsInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload: Record<string, any> = {
        userId: resolvedUserId,
        language: data.language,
        bodyType: data.bodyType,
        appearance: data.appearance,
        height: data.height,
        englishLevel: data.englishLevel || '',
        ethnicity: data.ethnicity || '',
      };

      // More Info is a partial details update. The general /profile/update
      // endpoint validates profile basics such as name, which should not be
      // required when editing only these fields.
      const res = await apiClient.put('/profile/update-details', payload);
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  type UpdateProfileInput = {
    userId?: any;
    name?: string;
    displayName?: string;
    bio?: string;
    dob?: string;
    age?: number;
    language?: string;
    bodyType?: string;
    appearance?: string;
    height?: number;
    englishLevel?: string;
    ethnicity?: string;
    lookingFor?: string;
    smoke?: string;
    drink?: string;
    photos?: string[];
    telegramUsername?: string;
  };

  const updateProfile = useMutation<any, Error, UpdateProfileInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload: Record<string, any> = {
        userId: resolvedUserId,
        ...data,
      };

      if (data.displayName || data.name) {
        payload.name = data.name || data.displayName;
        payload.displayName = data.displayName || data.name;
      }

      const res = await apiClient.put('/profile/update', payload).catch(() =>
        apiClient.put('/profile/update-basic', payload)
      );
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });

  type UpdateBasicInput = {
    userId?: any;
    name?: string;
    displayName: string;
    bio: string;
    dob?: string;
    age: number;
  };

  const updateBasic = useMutation<any, Error, UpdateBasicInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload = {
        userId: resolvedUserId,
        name: data.name || data.displayName,
        displayName: data.displayName,
        bio: data.bio,
        dob: data.dob,
        age: data.age,
      };

      const res = await apiClient.put('/profile/update', payload).catch(() =>
        apiClient.put('/profile/update-basic', payload)
      );
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
    },
  });



  type UploadImageInput = {
    uid?: any;
    photo: any;
  };

  const uploadImage = useMutation<any, Error, UploadImageInput>({
    mutationFn: async ({photo, uid}) => {
      const formData = createImageFormData('image', photo);
      const resolvedUserId = await resolveNumericUserId(uid);

      formData.append('userId', resolvedUserId);

      const res = await apiClient.post('/profile/upload-image', formData, {
        //headers: {'Content-Type': 'multipart/form-data'},
      });

      return res.data;
    },
  });

  type UploadSelfieInput = {
    uid?: any;
    photo: any;
  };

  const uploadSelfie = useMutation<any, Error, UploadSelfieInput>({
    mutationFn: async ({photo, uid}) => {
      const formData = createImageFormData('selfie', photo);
      const resolvedUserId = await resolveNumericUserId(uid);

      formData.append('userId', resolvedUserId);

      const res = await apiClient.post('/profile/selfie/upload', formData, {
        //headers: {'Content-Type': 'multipart/form-data'},
      });

      return res.data;
    },
  });

  type VerifySelfieInput = {
    uid?: any;
  };

  const verifySelfie = useMutation<any, Error, VerifySelfieInput>({
    mutationFn: async ({uid}) => {
      const resolvedUserId = await resolveNumericUserId(uid);

      const res = await apiClient.put(
        `/profile/selfie/verify/${resolvedUserId}`,
      );

      return res.data;
    },
    onSuccess: async (_, variables) => {
      await invalidateProfile(variables?.uid);
    },
  });

  type GenderOrientationInput = {
    userId?: any;
    gender: string;
    orientation: string;
  };

  const genderOrientation = useMutation<any, Error, GenderOrientationInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const body = {
        userId: resolvedUserId,
        gender: data.gender,
        orientation: data.orientation,
      };

      const res = await apiClient.post('/profile/gender-orientation', body);
      return res.data;
    },
  });

  return {
    useMyProfile,
    useProfileCompletion,
    getMyProfile: useMyProfile,
    getUser: useMyProfile,
    setupProfile,
    updateUser: setupProfile,
    updateProfile,
    useUpdateProfile: updateProfile,
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
