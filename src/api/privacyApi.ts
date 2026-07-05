import apiClient from './apiClient';

// NOTE: /privacy/details is deliberately NOT wrapped here — it has the same
// circular user<->profile serialization bug as /dashboard/recent and
// /dashboard/online (infinite nesting, leaks password hashes), confirmed
// live against the deployed backend. Only /privacy/status (a plain boolean)
// is safe to call.
export const privacyApi = {
  getStatus: async (userId: number): Promise<boolean> => {
    const response = await apiClient.get('/privacy/status', {
      params: { userId },
    });
    return response.data;
  },
};
