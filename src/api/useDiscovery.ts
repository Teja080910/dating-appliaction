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

export const isDeletedUserRecord = (user: any): boolean => {
  if (!user || typeof user !== 'object') return false;
  const p = user?.profile || {};
  if (user.isDeleted === true || p.isDeleted === true) return true;
  if (user.deleted === true || p.deleted === true) return true;
  if (user.deactivated === true || p.deactivated === true) return true;
  if (user.isActive === false || p.isActive === false) return true;
  const status = String(user.status || p.status || '').toUpperCase();
  if (['DELETED', 'DEACTIVATED', 'INACTIVE', 'SUSPENDED', 'SCHEDULED_FOR_DELETION', 'PENDING_DELETION'].includes(status)) {
    return true;
  }
  const accountStatus = String(user.accountStatus || p.accountStatus || '').toUpperCase();
  if (['DELETED', 'DEACTIVATED', 'INACTIVE', 'SUSPENDED', 'SCHEDULED_FOR_DELETION'].includes(accountStatus)) {
    return true;
  }
  return false;
};

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

  const sanitized = content
    .filter((u: any) => !isDeletedUserRecord(u))
    .map(sanitizeUserRecord);

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
  'distance',
  'searchWorldwide',
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

const isMaleGender = (g: string) => {
  const s = String(g).toLowerCase().trim();
  return s === 'male' || s === 'man' || s === 'straight_man' || (s.includes('male') && !s.includes('female')) || (s.includes('man') && !s.includes('woman'));
};

const isFemaleGender = (g: string) => {
  const s = String(g).toLowerCase().trim();
  return s === 'female' || s === 'woman' || s === 'straight_woman' || s.includes('female') || s.includes('woman');
};

const normalizeSearchRequest = (data: any) => {
  let resolvedGender: string | undefined = undefined;
  if (Array.isArray(data?.gender) && data.gender.length > 0) {
    const hasWoman = data.gender.some((g: any) => isFemaleGender(String(g)));
    const hasMan = data.gender.some((g: any) => isMaleGender(String(g)));
    if (hasWoman && hasMan) {
      resolvedGender = 'both';
    } else if (hasMan) {
      resolvedGender = 'man';
    } else if (hasWoman) {
      resolvedGender = 'woman';
    } else {
      resolvedGender = String(data.gender[0]);
    }
  } else if (data?.showMe || data?.gender) {
    const rawGender = String(data?.gender || data?.showMe).toLowerCase();
    if (rawGender === 'both') {
      resolvedGender = 'both';
    } else if (isFemaleGender(rawGender)) {
      resolvedGender = 'woman';
    } else if (isMaleGender(rawGender)) {
      resolvedGender = 'man';
    } else {
      resolvedGender = String(data?.gender || data?.showMe);
    }
  }

  return {
    // Only send the fields the backend reliably supports. Everything else is
    // applied client-side by matchesSearchFilters. This avoids a bad/missing
    // backend field wiping out the entire result set.
    name: data?.name || data?.search || undefined,
    // Everything else is applied locally. Sending partially-supported fields
    // to the backend was filtering the whole result set down to zero.
    gender: undefined,
    minAge: undefined,
    maxAge: undefined,
    sortBy: typeof data?.sortBy === 'string' ? data.sortBy.trim() : 'createdAt',

    // Handled locally so multi-select OR matching works:
    language: undefined,
    ethnicity: undefined,
    smoke: undefined,
    bodyType: undefined,
    lookingFor: undefined,
    appearance: undefined,
    englishLevel: undefined,
    minHeight: undefined,
    maxHeight: undefined,
    // Radius / worldwide / location are filtered locally using the selected
    // city coordinates or device GPS, so the backend can't zero the results.
    distance: undefined,
    searchWorldwide: undefined,
    worldwide: undefined,
    searchRadius: undefined,
    maxDistanceKm: undefined,
    radius: undefined,
    latitude: undefined,
    longitude: undefined,
    city: undefined,
    onlyOnline: undefined,

    page: Number.isFinite(Number(data?.page)) ? Number(data.page) : undefined,
    size: Number.isFinite(Number(data?.size)) ? Number(data.size) : undefined,
  };
};

const normalizeSearchUsersResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload.filter((u: any) => !isDeletedUserRecord(u)).map(sanitizeUserRecord);
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data.filter((u: any) => !isDeletedUserRecord(u)).map(sanitizeUserRecord);
    }
    if (Array.isArray(payload.content)) {
      return payload.content.filter((u: any) => !isDeletedUserRecord(u)).map(sanitizeUserRecord);
    }
    if (Array.isArray(payload.users)) {
      return payload.users.filter((u: any) => !isDeletedUserRecord(u)).map(sanitizeUserRecord);
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
