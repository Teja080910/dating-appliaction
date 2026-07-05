import apiClient from './apiClient';

export const locationApi = {
  add: async (data: { userId: string; city: string; state: string; country: string; lat: number; lng: number }) => {
    const response = await apiClient.post('/location/add', data);
    return response.data;
  },

  switchLocation: async (userId: string, locationId: number) => {
    const response = await apiClient.put('/location/switch', null, {
      params: { userId, locationId },
    });
    return response.data;
  },

  current: async (userId: string) => {
    const response = await apiClient.get(`/location/current/${userId}`);
    return response.data;
  },

  // CONFIRMED UNSAFE — live-tested against the deployed backend and it has
  // the same circular user<->profile serialization bug found on
  // /dashboard/recent, /dashboard/online, and /privacy/details (infinite
  // nesting, leaks password hashes). Do not call this from the app until
  // the backend fixes the serialization; there is no frontend workaround.
  history: async (userId: string) => {
    const response = await apiClient.get(`/location/history/${userId}`);
    return response.data;
  },

  // NOT VERIFIED SAFE — returns User-shaped records from the same entity
  // graph as the confirmed-broken endpoints above. It happened to return an
  // empty array in testing (no nearby test users), so the bug couldn't be
  // observed directly, but it likely shares the same serialization issue
  // once it returns non-empty results. Treat as risky until confirmed.
  getNearbyUsers: async (userId: string, radius: number = 100) => {
    const response = await apiClient.get('/location/nearby', {
      params: { userId, radius },
    });
    return response.data;
  },
};
