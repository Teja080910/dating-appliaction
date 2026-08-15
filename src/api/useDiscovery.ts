import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { toApiUserId } from './apiClient';
import { isResolvedApiUserId } from '../utils/sessionState';
import { getUserId } from '../utils/sessionHelper';

const normalizeArrayFilter = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
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

const normalizeSearchRequest = (data: any) => ({
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
  smoke:
    typeof data?.smoke === 'string'
      ? data.smoke.trim()
      : typeof data?.smoke === 'boolean'
        ? String(data.smoke)
        : undefined,
  drink:
    typeof data?.drink === 'string'
      ? data.drink.trim()
      : typeof data?.drink === 'boolean'
        ? String(data.drink)
        : undefined,
  sortBy: typeof data?.sortBy === 'string' ? data.sortBy.trim() : undefined,
});

const normalizeSearchUsersResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    if (Array.isArray(payload.content)) {
      return payload.content;
    }
    if (Array.isArray(payload.users)) {
      return payload.users;
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
      const payload: Record<string, any> = {
        userId: data.userId ? String(data.userId) : undefined,
        search: data.search,
        gender: normalizeArrayFilter(data.gender),
        bodyType: normalizeArrayFilter(data.bodyType),
        appearance: normalizeArrayFilter(data.appearance),
        language: normalizeArrayFilter(data.language),
        englishLevel: normalizeArrayFilter(data.englishLevel),
        ethnicity: normalizeArrayFilter(data.ethnicity),
        lookingFor: normalizeArrayFilter(data.lookingFor),
        smoke: normalizeBooleanFilter(data.smoke),
        drink: normalizeBooleanFilter(data.drink),
        maxDistanceKm: Number.isFinite(Number(data?.maxDistanceKm)) ? Number(data.maxDistanceKm) : undefined,
        worldwide: typeof data?.worldwide === 'boolean' ? data.worldwide : undefined,
        page: Number.isFinite(Number(data?.page)) ? Number(data.page) : 0,
        size: Number.isFinite(Number(data?.size)) ? Number(data.size) : 20,
      };

      // Remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res = await apiClient.post('/users/filter', payload);
      return normalizePagedUsersResponse(res.data);
    },
  });

  // =========================
  // 🔍 SEARCH USERS
  // =========================
  const searchUsers = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/search', normalizeSearchRequest(data));
      return normalizeSearchUsersResponse(res.data);
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
