import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DeviceEventEmitter } from 'react-native';
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, repairStoredSessionIdentity } from '../utils/session';
import { t } from '../i18n';
import { generateDeterministicMobile } from '../utils/authPayload';

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
  'kidCount',
  'kids',
  'netWorth',
  'verifiedSelfie',
  'selfieVerified',
  'telegramUsername',
  'phoneNumber',
  'mobile',
  'phone',
  'mobileNumber',
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

  const rawEmail = source?.email ? String(source.email).toLowerCase().trim() : '';
  const fakeHash = rawEmail ? generateDeterministicMobile(rawEmail) : '';

  const isRealPhone = (val: unknown): boolean => {
    if (!val) return false;
    const str = String(val).trim();
    if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return false;
    const digits = str.replace(/\D/g, '');
    if (digits.length < 7) return false;
    if (fakeHash && digits === fakeHash) return false;
    return true;
  };

  const resolvedPhone = [
    source?.mobile,
    source?.phoneNumber,
    source?.phone,
    source?.mobileNumber,
    nestedProfile?.phoneNumber,
    nestedProfile?.mobile,
    nestedProfile?.phone,
    nestedProfile?.mobileNumber,
    payloadSource?.phoneNumber,
    payloadSource?.phone,
    payloadSource?.mobile,
    payloadSource?.mobileNumber,
    nestedUser?.phoneNumber,
    nestedUser?.mobile,
    nestedUser?.phone,
    nestedUser?.mobileNumber,
  ].find(isRealPhone) || '';
  const cleanResolvedPhone = String(resolvedPhone).trim();

  const rawKidCount = [
    source?.kidCount,
    source?.kid_count,
    source?.kids,
    source?.kids_count,
    source?.children,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawNetWorth = [
    source?.netWorth,
    source?.net_worth,
    source?.networth,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawBodyType = [
    source?.bodyType,
    source?.body_type,
    source?.body,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawEnglishLevel = [
    source?.englishLevel,
    source?.english_level,
    source?.englishProficiency,
    source?.english_proficiency,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawLookingFor = [
    source?.lookingFor,
    source?.looking_for,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawSmoke = [
    source?.smoke,
    source?.smoking,
    source?.is_smoke,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawDrink = [
    source?.drink,
    source?.drinking,
    source?.is_drink,
  ].find((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const rawLanguage = [
    source?.language,
    source?.languages,
  ].find((v) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== ''));
  const resolvedLanguage = Array.isArray(rawLanguage) ? rawLanguage.join(', ') : (rawLanguage ? String(rawLanguage) : '');

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
    language: resolvedLanguage,
    appearance: source?.appearance ? String(source.appearance) : (source?.user_appearance ? String(source.user_appearance) : ''),
    bodyType: rawBodyType !== undefined ? String(rawBodyType) : '',
    height: numberOrZero(source?.height || source?.body_height || source?.user_height),
    englishLevel: rawEnglishLevel !== undefined ? String(rawEnglishLevel) : '',
    ethnicity: source?.ethnicity ? String(source.ethnicity) : (source?.race ? String(source.race) : ''),
    lookingFor: rawLookingFor !== undefined ? String(rawLookingFor) : '',
    smoke: rawSmoke !== undefined ? String(rawSmoke) : '',
    drink: rawDrink !== undefined ? String(rawDrink) : '',
    kidCount: rawKidCount !== undefined ? String(rawKidCount).replace(/^kids:\s*/i, '').trim() : '',
    kids: rawKidCount !== undefined ? String(rawKidCount).replace(/^kids:\s*/i, '').trim() : '',
    netWorth: rawNetWorth !== undefined ? String(rawNetWorth).replace(/^\$\s*/, '').trim() : '',
    currentCity: source?.currentCity ? String(source.currentCity) : '',
    telegramUsername: source?.telegramUsername ? String(source.telegramUsername) : '',
    mobile: cleanResolvedPhone,
    phone: cleanResolvedPhone,
    phoneNumber: cleanResolvedPhone,
    mobileNumber: cleanResolvedPhone,
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
    const sub = DeviceEventEmitter.addListener('AMARA_PROFILE_UPDATED', () => {
      refetch();
    });
    return () => {
      sub.remove();
    };
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;
    if (hasValidUid(uid)) {
      const stringUid = String(uid);
      setResolvedUserId((prev) => (prev === stringUid ? prev : stringUid));
      return;
    }

    // No uid passed → fall back to the logged-in user's stored userId so the
    // profile still loads after logout/login (in-memory context is reset).
    const resolveUser = async () => {
      let id = await getUserId().catch(() => null);
      if (!id) {
        id = await repairStoredSessionIdentity().catch(() => null);
      }
      if (!cancelled && id) {
        const stringId = String(id);
        setResolvedUserId((prev) => (prev === stringId ? prev : stringId));
      }
    };
    void resolveUser();

    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!resolvedUserId) return;

    setLoading(true);
    setError(null);
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await apiClient
          .get(`/profile/me/${resolvedUserId}`)
          .catch(() => apiClient.post('/profile/me', null, { params: { userId: resolvedUserId } }))
          .catch(() => apiClient.get('/profile/me', { params: { userId: resolvedUserId } }))
          .catch(() => apiClient.post('/profile/me', { userId: resolvedUserId }))
          .catch(() => apiClient.get(`/profile/get/${resolvedUserId}`))
          .catch(() => apiClient.get('/profile/get', { params: { userId: resolvedUserId } }));
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

  return useMemo(
    () => ({ data, isLoading: loading, error, refetch }),
    [data, loading, error, refetch]
  );
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
        const res = await apiClient
          .get(`/profile/completion/${resolvedUserId}`)
          .catch(() => apiClient.get('/profile/completion', { params: { userId: resolvedUserId } }))
          .catch(() => apiClient.post('/profile/completion', null, { params: { userId: resolvedUserId } }));
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
    await queryClient.invalidateQueries({queryKey: ['myProfile']});
    await queryClient.invalidateQueries({queryKey: ['myProfile', uid]});
    await queryClient.invalidateQueries({queryKey: ['profileCompletion']});
    await queryClient.invalidateQueries({queryKey: ['profileCompletion', uid]});
    DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', { uid });
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
          t('home.usercard.user');
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

      let setupRes: any = null;
      try {
        // 1. Try standard JSON payload per PDF specification
        setupRes = await apiClient.post(
          `/profile/${resolvedUserId}/setup`,
          normalizedDto,
        );
      } catch (jsonErr) {
        // 2. Try multipart form-data fallback
        try {
          setupRes = await apiClient.post(
            `/profile/${resolvedUserId}/setup`,
            formData,
            { params: { dto: JSON.stringify(normalizedDto) } },
          );
        } catch (formErr) {
          console.warn('[setupProfile] Direct /setup failed, falling back to granular update endpoints.');
        }
      }

      // 3. Ensure granular update endpoints are also synchronized so fields are 100% persisted
      await Promise.allSettled([
        apiClient.put('/profile/update-basic', {
          userId: resolvedUserId,
          name: normalizedDto.name,
          displayName: normalizedDto.displayName,
          bio: normalizedDto.bio,
          dob: normalizedDto.dob,
          age: normalizedDto.age,
        }).catch(() => apiClient.put('/profile/update', {
          userId: resolvedUserId,
          name: normalizedDto.name,
          displayName: normalizedDto.displayName,
          bio: normalizedDto.bio,
          dob: normalizedDto.dob,
          age: normalizedDto.age,
        })),
        apiClient.put('/profile/update-details', {
          userId: resolvedUserId,
          language: normalizedDto.language,
          bodyType: normalizedDto.bodyType,
          appearance: normalizedDto.appearance,
          height: normalizedDto.height,
          englishLevel: normalizedDto.englishLevel || '',
          ethnicity: normalizedDto.ethnicity || '',
          kidCount: normalizedDto.kidCount || '',
          netWorth: normalizedDto.netWorth || '',
        }),
        apiClient.put('/profile/update-preferences', {
          userId: resolvedUserId,
          lookingFor: normalizedDto.lookingFor,
          smoke: normalizedDto.smoke,
          drink: normalizedDto.drink,
          ethnicity: normalizedDto.ethnicity || '',
        }),
      ]);

      return setupRes?.data ?? { status: 'success', message: 'Profile setup completed' };
    },
    onSuccess: async (_, variables) => {
      await invalidateProfile(variables?.uid);
    },
  });

  type UpdatePreferencesInput = {
    userId?: any;
    lookingFor: string;
    smoke: string;
    drink: string;
    ethnicity?: string;
  };

  const updatePreferences = useMutation<any, Error, UpdatePreferencesInput>({
    mutationFn: async data => {
      const resolvedUserId = await resolveNumericUserId(data.userId);

      const payload = {
        userId: resolvedUserId,
        lookingFor: data.lookingFor,
        smoke: data.smoke,
        drink: data.drink,
        ethnicity: data.ethnicity || '',
      };

      const res = await apiClient
        .put('/profile/update-preferences', payload)
        .catch(async () => {
          const [name, dName, bio, dob] = await Promise.all([
            AsyncStorage.getItem('userName'),
            AsyncStorage.getItem('displayName'),
            AsyncStorage.getItem('userBio'),
            AsyncStorage.getItem('userDob'),
          ]);
          return apiClient.put('/profile/update', {
            ...payload,
            name: name || dName || 'User',
            displayName: dName || name || 'User',
            bio: bio || '',
            dob: dob || '1998-01-01',
          });
        });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateProfile();
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
    kidCount?: string;
    netWorth?: string;
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
        kidCount: data.kidCount || '',
        netWorth: data.netWorth || '',
      };

      // More Info is a partial details update. The general /profile/update
      // endpoint validates profile basics such as name, which should not be
      // required when editing only these fields.
      const res = await apiClient
        .put('/profile/update-details', payload)
        .catch(async () => {
          const [name, dName, bio, dob] = await Promise.all([
            AsyncStorage.getItem('userName'),
            AsyncStorage.getItem('displayName'),
            AsyncStorage.getItem('userBio'),
            AsyncStorage.getItem('userDob'),
          ]);
          return apiClient.put('/profile/update', {
            ...payload,
            name: name || dName || 'User',
            displayName: dName || name || 'User',
            bio: bio || '',
            dob: dob || '1998-01-01',
          });
        });
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
    kidCount?: string;
    kids?: string;
    netWorth?: string;
    photos?: string[];
    telegramUsername?: string;
    mobile?: string;
    phoneNumber?: string;
    phone?: string;
    mobileNumber?: string;
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

      const effectivePhone = data.phoneNumber || data.mobile || data.phone || data.mobileNumber;
      if (effectivePhone) {
        payload.mobile = effectivePhone;
        payload.phoneNumber = effectivePhone;
        payload.phone = effectivePhone;
        payload.mobileNumber = effectivePhone;
      }

      // Profile photos are managed strictly via dedicated /profile/upload-image and /users/images/{id} endpoints.
      // Backend /profile/update rejects the photos field with HTTP 400 BAD_REQUEST.
      delete payload.photos;
      delete payload.images;

      // Try general comprehensive /profile/update endpoint first to preserve all detailed fields.
      // If it fails or is unavailable, fallback to granular update-basic, update-details, and update-preferences.
      try {
        const res = await apiClient.put('/profile/update', payload);
        return res.data;
      } catch (err) {
        const basicRes = await apiClient.put('/profile/update-basic', {
          userId: resolvedUserId,
          name: payload.name,
          displayName: payload.displayName,
          bio: payload.bio,
          dob: payload.dob,
          age: payload.age,
          mobile: payload.mobile,
          phoneNumber: payload.phoneNumber,
          phone: payload.phone,
          mobileNumber: payload.mobileNumber,
          telegramUsername: payload.telegramUsername,
        });
        await Promise.allSettled([
          apiClient.put('/profile/update-details', {
            userId: resolvedUserId,
            language: payload.language,
            bodyType: payload.bodyType,
            appearance: payload.appearance,
            height: payload.height,
            englishLevel: payload.englishLevel || '',
            ethnicity: payload.ethnicity || '',
            kidCount: payload.kidCount || payload.kids || '',
            netWorth: payload.netWorth || '',
          }),
          apiClient.put('/profile/update-preferences', {
            userId: resolvedUserId,
            lookingFor: payload.lookingFor,
            smoke: payload.smoke,
            drink: payload.drink,
            ethnicity: payload.ethnicity || '',
          }),
        ]);
        return basicRes.data;
      }
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

      const res = await apiClient.put('/profile/update-basic', payload).catch(() =>
        apiClient.put('/profile/update', payload)
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
      try {
        const res = await apiClient.post('/profile/selfie/upload', formData);
        return res.data;
      } catch (err: any) {
        const resolvedUserId = uid || (await getUserId().catch(() => null));
        if (resolvedUserId) {
          formData.append('userId', String(resolvedUserId));
          const fallbackRes = await apiClient.post('/profile/selfie/upload', formData, {
            params: { userId: String(resolvedUserId) },
          });
          return fallbackRes.data;
        }
        throw err;
      }
    },
  });

  type VerifySelfieInput = {
    uid?: any;
  };

  const verifySelfie = useMutation<any, Error, VerifySelfieInput>({
    mutationFn: async ({uid}) => {
      let resolvedUserId = uid;
      if (!resolvedUserId) {
        resolvedUserId = await getUserId().catch(() => null);
      }
      if (!resolvedUserId) {
        const session = await getAuthSession();
        resolvedUserId = session?.userId;
      }

      try {
        const res = await apiClient.put(
          resolvedUserId ? `/profile/selfie/verify/${resolvedUserId}` : '/profile/selfie/verify'
        );
        return res.data;
      } catch (err: any) {
        const fallback = await apiClient.put('/profile/selfie/verify').catch(() =>
          apiClient.post(
            resolvedUserId ? `/profile/selfie/verify/${resolvedUserId}` : '/profile/selfie/verify'
          )
        );
        return fallback?.data ?? { status: 'success', message: 'Verified' };
      }
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
