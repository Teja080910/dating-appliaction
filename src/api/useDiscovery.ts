import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

const normalizeArrayFilter = (value: unknown) => {
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
    return items.length > 0 ? items : undefined;
  }

  if (value === null || value === undefined || String(value).trim() === '') {
    return undefined;
  }

  return [value];
};

const normalizeBooleanFilter = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', 'smoker', 'drinker'].includes(normalized)) {
      return true;
    }
    if (['no', 'false', 'non-smoker', 'non smoker', 'non-drinker', 'non drinker'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const SENSITIVE_USER_FIELDS = ['mobile', 'password'];

const sanitizeUserRecord = (user: any): any => {
  if (!user || typeof user !== 'object') {
    return user;
  }

  const copy = { ...user };
  const resolvedUserId = copy.userId ?? copy.uid ?? copy.profile?.userId ?? copy.id;
  copy.userId = resolvedUserId !== undefined && resolvedUserId !== null
    ? String(resolvedUserId)
    : '';
  if (!Object.prototype.hasOwnProperty.call(copy, 'telegramUsername')) {
    copy.telegramUsername = '';
  }
  SENSITIVE_USER_FIELDS.forEach((field) => {
    delete copy[field];
    if (copy.profile && typeof copy.profile === 'object') {
      delete copy.profile[field];
    }
  });
  return copy;
};

const normalizePagedUsersResponse = (payload: any) => {
  const base =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {};

  const content =
    (Array.isArray(base.content) ? base.content : null) ||
    (Array.isArray(base.users) ? base.users : null) ||
    (Array.isArray(base.data) ? base.data : null) ||
    (Array.isArray(payload) ? payload : []);

  const sanitized = content.map(sanitizeUserRecord);

  return {
    totalPages: Number(base.totalPages ?? 0),
    totalElements: Number(base.totalElements ?? content.length ?? 0),
    first: Boolean(base.first ?? true),
    last: Boolean(base.last ?? true),
    size: Number(base.size ?? content.length ?? 0),
    content: sanitized,
    number: Number(base.number ?? 0),
    numberOfElements: Number(base.numberOfElements ?? content.length ?? 0),
    empty: Boolean(base.empty ?? content.length === 0),
    pageable: base.pageable ?? null,
    sort: base.sort ?? [],
  };
};

const CORE_SEARCH_KEYS = [
  'name',
  'gender',
  'minAge',
  'maxAge',
  'language',
  'ethnicity',
  'smoke',
  'drink',
  'sortBy',
];

const extractCore9Fields = (payload: Record<string, any>) => {
  const core: Record<string, any> = {};
  CORE_SEARCH_KEYS.forEach((key) => {
    if (payload[key] !== undefined) {
      core[key] = payload[key];
    }
  });
  return core;
};

const normalizeSmokeDrink = (val: unknown) => {
  if (typeof val === 'string' && val.trim() !== '') return val.trim();
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return undefined;
};

const normalizeSearchRequest = (data: any) => {
  let resolvedGender: string | undefined = undefined;
  const rawGender =
    typeof data?.gender === 'string'
      ? data.gender
      : Array.isArray(data?.gender) && data.gender.length > 0
        ? data.gender[0]
        : data?.showMe;
  if (rawGender) {
    const cleanG = String(rawGender).toLowerCase();
    if (cleanG.includes('woman') || cleanG.includes('female')) resolvedGender = 'woman';
    else if (cleanG.includes('man') || cleanG.includes('male')) resolvedGender = 'man';
    else resolvedGender = String(rawGender);
  }

  return {
    // === Core 9 Backend-supported fields ===
    name: data?.name || data?.search || undefined,
    gender: resolvedGender,
    minAge: Number.isFinite(Number(data?.minAge)) ? Number(data.minAge) : undefined,
    maxAge: Number.isFinite(Number(data?.maxAge)) ? Number(data.maxAge) : undefined,
    language:
      typeof data?.language === 'string'
        ? data.language.trim()
        : Array.isArray(data?.language) && data.language.length > 0
          ? String(data.language[0]).trim()
          : undefined,
    ethnicity:
      typeof data?.ethnicity === 'string'
        ? data.ethnicity.trim()
        : Array.isArray(data?.ethnicity) && data.ethnicity.length > 0
          ? String(data.ethnicity[0]).trim()
          : undefined,
    smoke: normalizeSmokeDrink(data?.smoke),
    drink: normalizeSmokeDrink(data?.drink),
    sortBy: typeof data?.sortBy === 'string' ? data.sortBy.trim() : 'createdAt',

    // === Extra filter fields ready for backend ===
    minHeight: Number.isFinite(Number(data?.minHeight)) ? Number(data.minHeight) : undefined,
    maxHeight: Number.isFinite(Number(data?.maxHeight)) ? Number(data.maxHeight) : undefined,
    bodyType: normalizeArrayFilter(data?.bodyType),
    appearance: normalizeArrayFilter(data?.appearance),
    englishLevel: normalizeArrayFilter(data?.englishLevel),
    lookingFor: normalizeArrayFilter(data?.lookingFor),
    searchRadius: Number.isFinite(Number(data?.searchRadius ?? data?.maxDistanceKm))
      ? Number(data.searchRadius ?? data.maxDistanceKm)
      : undefined,
    maxDistanceKm: Number.isFinite(Number(data?.maxDistanceKm ?? data?.searchRadius))
      ? Number(data.maxDistanceKm ?? data.searchRadius)
      : undefined,
    worldwide: typeof data?.worldwide === 'boolean' ? data.worldwide : undefined,
    city:
      typeof data?.city === 'string'
        ? data.city.trim()
        : typeof data?.location === 'string'
          ? data.location.trim()
          : undefined,
    onlyOnline: data?.onlyOnline === true ? true : undefined,
  };
};

const normalizeSearchUsersResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload.map(sanitizeUserRecord);
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data.map(sanitizeUserRecord);
    }
    if (Array.isArray(payload.content)) {
      return payload.content.map(sanitizeUserRecord);
    }
    if (Array.isArray(payload.users)) {
      return payload.users.map(sanitizeUserRecord);
    }
  }

  return [];
};

export const useDiscovery = (userId?: any) => {
  void userId;

  const fetchDashboardUsers = async (
    endpoint: '/dashboard/recent' | '/dashboard/online',
    params?: { page?: number; size?: number }
  ) => {
    const res = await apiClient.get(endpoint, {
      params: {
        page: Number.isFinite(Number(params?.page)) ? Number(params?.page) : 0,
        size: Number.isFinite(Number(params?.size)) ? Number(params?.size) : 10,
      },
    });

    return normalizePagedUsersResponse(res.data);
  };

  // =========================
  // 🔥 FILTER USERS (MAIN SWIPE API)
  // =========================
  const filterUsers = useMutation({
    mutationFn: async (data: any) => {
      const searchPayload = normalizeSearchRequest(data);
      Object.keys(searchPayload).forEach(
        (k) => (searchPayload as any)[k] === undefined && delete (searchPayload as any)[k]
      );

      try {
        const res = await apiClient.post('/search', searchPayload);
        return normalizePagedUsersResponse(res.data);
      } catch (searchError: any) {
        // If backend fails due to unrecognized extra properties, gracefully retry with core 9 fields
        if (searchError?.response?.status === 400) {
          try {
            console.log('[useDiscovery] POST /search 400 -> retrying with core 9 fields');
            const corePayload = extractCore9Fields(searchPayload);
            const coreRes = await apiClient.post('/search', corePayload);
            return normalizePagedUsersResponse(coreRes.data);
          } catch (retryError) {
            console.warn('[useDiscovery] Retry with core 9 fields failed', retryError);
          }
        }
        throw searchError;
      }
    },
  });

  // =========================
  // 🔍 SEARCH USERS
  // =========================
  const searchUsers = useMutation({
    mutationFn: async (data: any) => {
      const searchPayload = normalizeSearchRequest(data);
      Object.keys(searchPayload).forEach(
        (k) => (searchPayload as any)[k] === undefined && delete (searchPayload as any)[k]
      );

      try {
        const res = await apiClient.post('/search', searchPayload);
        return normalizeSearchUsersResponse(res.data);
      } catch (searchError: any) {
        if (searchError?.response?.status === 400) {
          try {
            const corePayload = extractCore9Fields(searchPayload);
            const coreRes = await apiClient.post('/search', corePayload);
            return normalizeSearchUsersResponse(coreRes.data);
          } catch (retryError) {
            console.warn('[useDiscovery] searchUsers retry failed', retryError);
          }
        }
        throw searchError;
      }
    },
  });

  // =========================
  // 📊 DASHBOARD (AUTO FETCH)
  // =========================

  // ✅ Recent Users
  const recentUsers = useQuery({
    queryKey: ['discovery-recent-fallback'],
    queryFn: async () => fetchDashboardUsers('/dashboard/recent'),
    enabled: false,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  // ✅ Online Users
  const onlineUsers = useQuery({
    queryKey: ['discovery-online-fallback'],
    queryFn: async () => fetchDashboardUsers('/dashboard/online'),
    enabled: false,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  // =========================
  // 🔄 PAGINATION SUPPORT
  // =========================

  const getRecentUsers = useMutation({
    mutationFn: async ({ page = 0, size = 10 }: any) => {
      return fetchDashboardUsers('/dashboard/recent', { page, size });
    },
  });

  const getOnlineUsers = useMutation({
    mutationFn: async ({ page = 0, size = 10 }: any) => {
      return fetchDashboardUsers('/dashboard/online', { page, size });
    },
  });

  // =========================
  // 🏠 HOME USERS
  // =========================
  const getHomeUsers = useMutation({
    mutationFn: async (uid?: string) => {
      const resolvedUserId = uid || (await getUserId());
      if (!resolvedUserId) throw new Error('Unable to resolve userId');
      const res = await apiClient.get(`/home/${resolvedUserId}`);
      return res.data;
    },
  });

  return {
    // 🔥 MAIN DISCOVERY
    filterUsers,
    searchUsers,
    allMatches: filterUsers, // 👈 Added alias for UserList.tsx

    // 📊 DASHBOARD AUTO
    recentUsers,
    onlineUsers,

    // 🔄 PAGINATION (manual load more)
    getRecentUsers,
    getOnlineUsers,

    // 🏠 HOME
    getHomeUsers,
  };
};
