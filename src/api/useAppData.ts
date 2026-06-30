import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

/**
 * Hook for Global App State Data (Badges, Session, Profile)
 */
export const useAppData = (userId?: string) => {
  const resolveBackendUserId = async () => {
    const resolvedUserId = String(userId || '').trim() || await getUserId();
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return resolvedUserId;
  };

  // ✅ Get My Profile
  const getProfile = useQuery({
    queryKey: ['myProfile', userId ?? 'resolved'],
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.post(`/profile/me`, null, { params: { userId: resolvedUserId } });
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // ✅ Get Message Conversations (for unread count)
  const getMessages = useQuery({
    queryKey: ['myConversations', userId],
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });

  return {
    getProfile,
    getMessages,
  };
};
