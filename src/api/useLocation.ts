import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

export interface LocationItem {
  id: number;
  userId: number | null;
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

  return {
    id: typeof source?.id === 'number' ? source.id : 0,
    userId: typeof source?.userId === 'number' ? source.userId : null,
    city: String(source?.city || '').trim(),
    state: String(source?.state || '').trim(),
    country: String(source?.country || '').trim(),
    lat: typeof source?.lat === 'number' ? source.lat : null,
    lng: typeof source?.lng === 'number' ? source.lng : null,
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
    const resolvedUserId = String(userId || '').trim() || await getUserId();

    if (!resolvedUserId) {
      throw new Error('Unable to resolve a valid userId for location.');
    }

    return resolvedUserId;
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
      lat: number;
      lng: number;
    }) => {
      const resolvedUserId = await resolveBackendUserId();
      const payload = {
        userId: Number(resolvedUserId),
        ...data,
      };

      const res = await apiClient.post('/location/add', payload);
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
          userId: Number(resolvedUserId),
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
      const res = await apiClient.get(`/location/history/${resolvedUserId}`);
      return normalizeLocationList(res.data);
    },
  });

  const useCurrentLocation = () => useQuery({
    queryKey: currentQueryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.get(`/location/current/${resolvedUserId}`);
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
