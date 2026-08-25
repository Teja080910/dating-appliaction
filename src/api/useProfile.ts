import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import apiClient from './apiClient';
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
  const hasExplicitUid = uid !== undefined && uid !== null && String(uid).trim() !== '';
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    hasExplicitUid ? String(uid) : null,
  );

  useEffect(() => {
    let cancelled = false;
    if (uid !== undefined && uid !== null && String(uid).trim() !== '') {
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
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await apiClient.post(`/profile/me`, null, { params: { userId: resolvedUserId } });
        if (!cancelled) {
          setData(normalizeProfile(res.data));
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [resolvedUserId]);

  return { data, isLoading: loading };
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
  };

  const updateDetails = useMutation<any, Error, UpdateDetailsInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload = {
        userId: resolvedUserId,
        language: data.language,
        bodyType: data.bodyType,
        appearance: data.appearance,
        height: data.height,
      };

      const res = await apiClient.put('/profile/update-details', payload);
      return res.data;
    },
  });

  type UpdateBasicInput = {
    userId?: any;
    name?: string;
    displayName: string;
    bio: string;
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
        age: data.age,
      };

      const res = await apiClient.put('/profile/update-basic', payload);
      return res.data;
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
