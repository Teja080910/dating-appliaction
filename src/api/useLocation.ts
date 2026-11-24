import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';

export interface LocationItem {
  id: number;
  userId: number | string | null;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  current: boolean;
  createdAt: string | null;
}

const normalizeLocationItem = (payload: any): LocationItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source =
    payload?.data && typeof payload.data === 'object'
      ? payload.data
      : payload;

  const lat =
    typeof source?.latitude === 'number'
      ? source.latitude
      : typeof source?.lat === 'number'
      ? source.lat
      : null;
  const lng =
    typeof source?.longitude === 'number'
      ? source.longitude
      : typeof source?.lng === 'number'
      ? source.lng
      : null;

  return {
    id: typeof source?.id === 'number' ? source.id : Number(source?.id) || 0,
    userId: source?.userId ?? null,
    city: String(source?.city || '').trim(),
    state: String(source?.state || '').trim(),
    country: String(source?.country || '').trim(),
    lat,
    lng,
    current: Boolean(source?.current),
    createdAt: source?.createdAt ? String(source.createdAt) : null,
  };
};

const normalizeLocationList = (payload: unknown): LocationItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeLocationItem(item))
      .filter((item): item is LocationItem => Boolean(item));
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const list =
      Array.isArray(record.data) ? record.data :
      Array.isArray(record.content) ? record.content :
      Array.isArray(record.locations) ? record.locations :
      [];

    return list
      .map((item) => normalizeLocationItem(item))
      .filter((item): item is LocationItem => Boolean(item));
  }

  return [];
};

const getLocationErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  fallback;

export const useLocation = (userId?: string) => {
  const queryClient = useQueryClient();
  const historyQueryKey = ['locationHistory', userId ?? 'resolved'];
  const currentQueryKey = ['currentLocation', userId ?? 'resolved'];

  const resolveBackendUserId = async () => {
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId();
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    throw new Error('Unable to resolve a valid userId for location.');
  };

  const invalidateLocationQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: historyQueryKey });
    await queryClient.invalidateQueries({ queryKey: currentQueryKey });
  };

  const addLocation = useMutation({
    mutationFn: async (data: {
      city: string;
      state: string;
      country: string;
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
    }) => {
      const resolvedUserId = await resolveBackendUserId();
      const latVal = typeof data.latitude === 'number' ? data.latitude : typeof data.lat === 'number' ? data.lat : 0;
      const lngVal = typeof data.longitude === 'number' ? data.longitude : typeof data.lng === 'number' ? data.lng : 0;

      const payload = {
        userId: resolvedUserId,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: latVal,
        longitude: lngVal,
        lat: latVal,
        lng: lngVal,
      };

      const res = await apiClient.post('/location/add', payload, {
        params: { userId: resolvedUserId },
      });
      return res.data;
    },
    onSuccess: async () => {
      await invalidateLocationQueries();
    },
  });

  const switchLocation = useMutation({
    mutationFn: async (locationId: number) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.put('/location/switch', null, {
        params: {
          userId: resolvedUserId,
          locationId,
        },
      });

      return res.data;
    },
    onSuccess: async () => {
      await invalidateLocationQueries();
    },
  });

  const useLocationHistory = () => useQuery({
    queryKey: historyQueryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get(`/location/history/${resolvedUserId}`, {
        params: { userId: resolvedUserId },
      });
      return normalizeLocationList(res.data);
    },
  });

  const useCurrentLocation = () => useQuery({
    queryKey: currentQueryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get(`/location/current/${resolvedUserId}`, {
        params: { userId: resolvedUserId },
      });
      return normalizeLocationItem(res.data);
    },
  });

  return {
    addLocation,
    switchLocation,
    useLocationHistory,
    useCurrentLocation,
    getLocationErrorMessage,
    locationHistory: useLocationHistory,
    currentLocation: useCurrentLocation,
  };
};

export const useNearbyUsers = () => {
  const getNearbyUsers = useMutation({
    mutationFn: async ({ userId, radius }: { userId?: string; radius?: number }) => {
      let resolvedUserId: string | null | undefined = userId;
      if (!resolvedUserId) {
        resolvedUserId = await getUserId().catch(() => null);
      }
      if (!resolvedUserId) {
        const session = await getAuthSession();
        resolvedUserId = session?.userId;
      }
      if (!resolvedUserId) throw new Error('Unable to resolve userId');

      const res = await apiClient.get('/location/nearby', {
        params: { userId: resolvedUserId, radius: radius ?? 50 },
      });
      return res.data;
    },
  });

  return { getNearbyUsers };
};

export const useNearbyProfiles = (radius = 50) => {
  return useQuery({
    queryKey: ['location-nearby', radius],
    queryFn: async () => {
      let resolvedUserId: string | null | undefined = await getUserId().catch(() => null);
      if (!resolvedUserId) {
        const session = await getAuthSession();
        resolvedUserId = session?.userId;
      }
      if (!resolvedUserId) return [];

      const res = await apiClient.get('/location/nearby', {
        params: { userId: resolvedUserId, radius },
      });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        return Array.isArray(data.data) ? data.data : Array.isArray(data.content) ? data.content : [];
      }
      return [];
    },
    retry: false,
  });
};
