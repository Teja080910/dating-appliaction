import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';
import { getAuthSession, isResolvedApiUserId } from '../utils/session';
import {
  getLocalBlockedUsers,
  removeBlockedUser,
  saveBlockedUser,
} from '../utils/types/AsyncStorage';

export interface ReportItem {
  id: number | string;
  reportedUserId: number | string | null;
  reportedById: number | string | null;
  reason: string;
  message: string;
  createdAt: string | null;
}

export interface BlockedUserItem {
  userId: string;
  name?: string;
  photo?: string;
  blockedAt?: string | null;
}

export const VALID_REPORT_REASONS = [
  'SPAM_SCAM',
  'INAPPROPRIATE_PHOTOS',
  'HARASSMENT',
  'UNDERAGE',
  'FAKE_PROFILE',
  'OTHER',
] as const;

export type ValidReportReason = typeof VALID_REPORT_REASONS[number];

export const normalizeReportReason = (rawReason?: string | null): ValidReportReason => {
  if (!rawReason) return 'OTHER';
  const clean = String(rawReason).trim().toUpperCase();

  if (VALID_REPORT_REASONS.includes(clean as ValidReportReason)) {
    return clean as ValidReportReason;
  }

  if (
    clean.includes('SCAM') ||
    clean.includes('FRAUD') ||
    clean.includes('SPAM') ||
    clean.includes('SOLICIT')
  ) {
    return 'SPAM_SCAM';
  }
  if (
    clean.includes('PHOTO') ||
    clean.includes('IMAGE') ||
    clean.includes('EXPLICIT') ||
    clean.includes('NUDITY') ||
    clean.includes('INAPPROPRIATE')
  ) {
    return 'INAPPROPRIATE_PHOTOS';
  }
  if (
    clean.includes('HARASS') ||
    clean.includes('ABUSIVE') ||
    clean.includes('THREAT') ||
    clean.includes('EXTORTION') ||
    clean.includes('CONTACT') ||
    clean.includes('SHARED')
  ) {
    return 'HARASSMENT';
  }
  if (
    clean.includes('UNDERAGE') ||
    clean.includes('MINOR') ||
    clean.includes('CHILD') ||
    clean.includes('AGE')
  ) {
    return 'UNDERAGE';
  }
  if (
    clean.includes('FAKE') ||
    clean.includes('BOT') ||
    clean.includes('CATFISH') ||
    clean.includes('IMPERSONAT')
  ) {
    return 'FAKE_PROFILE';
  }

  return 'OTHER';
};

const resolveBlockedArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.blockedUsers)) return record.blockedUsers;
    if (Array.isArray(record.content)) return record.content;
    if (Array.isArray(record.users)) return record.users;
  }
  return [];
};

const normalizeBlockedUsers = (payload: unknown): BlockedUserItem[] => {
  const items = resolveBlockedArray(payload);
  const result: BlockedUserItem[] = [];
  for (const item of items) {
    if (typeof item === 'string' || typeof item === 'number') {
      result.push({
        userId: String(item),
        name: `User ${item}`,
        photo: undefined,
        blockedAt: null,
      });
      continue;
    }
    const rawId = item?.userId ?? item?.id ?? item?.blockedUserId ?? item?.targetUserId;
    if (rawId) {
      result.push({
        userId: String(rawId),
        name: item?.name || item?.displayName || item?.userName || `User ${rawId}`,
        photo: item?.photo || item?.imageUrl || (Array.isArray(item?.photos) ? item.photos[0] : undefined),
        blockedAt: item?.blockedAt || item?.createdAt || null,
      });
    }
  }
  return result;
};

const resolveReportsArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as any[];
    }
    if (Array.isArray(record.content)) {
      return record.content as any[];
    }
    if (Array.isArray(record.reports)) {
      return record.reports as any[];
    }
  }

  return [];
};

const normalizeReports = (payload: unknown): ReportItem[] =>
  resolveReportsArray(payload).map((report) => ({
    id: report?.id ?? '0',
    reportedUserId:
      report?.reportedUserId ?? null,
    reportedById:
      report?.reportedById ?? null,
    reason: String(report?.reason || '').trim(),
    message: String(report?.message || '').trim(),
    createdAt: report?.createdAt ? String(report.createdAt) : null,
  }));

const getReportErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data === 'string' ? err.response.data : null) ||
  err?.message ||
  fallback;

/**
 * Hook for Reporting related operations.
 * Swagger: report-controller
 */
export const useReport = (userId?: string | number | null) => {
  const queryClient = useQueryClient();

  const resolveBackendUserId = async (candidate?: string | number | null) => {
    if (candidate && isResolvedApiUserId(String(candidate))) return String(candidate);
    if (userId && isResolvedApiUserId(String(userId))) return String(userId);
    const stored = await getUserId().catch(() => null);
    if (stored && isResolvedApiUserId(stored)) return stored;
    const session = await getAuthSession();
    if (session?.userId && isResolvedApiUserId(session.userId)) {
      return String(session.userId);
    }
    if (stored) return stored;
    if (userId) return String(userId);
    if (candidate) return String(candidate);
    throw new Error('Unable to resolve backend userId for reports.');
  };
  const myReportsKey = ['reports', 'my'];
  const againstReportsKey = ['reports', 'against'];

  const reportMutation = useMutation({
    mutationFn: async (data: { byUserId?: string | number; targetUserId: string | number; reason: string; message: string }) => {
      let activeBy = data?.byUserId ? String(data.byUserId).trim() : '';
      if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
        try {
          activeBy = await resolveBackendUserId();
        } catch {
          activeBy = '';
        }
      }

      const normalizedReason = normalizeReportReason(data.reason);
      const safeMessage = data.message?.trim() || `Reported for ${data.reason}`;

      const response = await apiClient.post(
        '/reports/report',
        {
          reporterUserId: activeBy,
          reportedUserId: String(data.targetUserId),
          byUserId: activeBy,
          targetUserId: String(data.targetUserId),
          reason: normalizedReason,
          message: safeMessage,
          details: safeMessage,
        },
        {
          params: {
            reporterUserId: activeBy,
            reportedUserId: String(data.targetUserId),
            userId: activeBy,
          },
        },
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myReportsKey });
      await queryClient.invalidateQueries({ queryKey: againstReportsKey });
    },
    onError: (err: any) => {
      console.error('Report Error:', getReportErrorMessage(err, 'Failed to submit report.'));
    },
  });

  const myReportsQuery = useQuery({
    queryKey: myReportsKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient.get('/reports/my', {
        params: { userId: resolvedUserId },
      });

      return normalizeReports(response.data);
    },
  });

  const againstReportsQuery = useQuery({
    queryKey: againstReportsKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient.get('/reports/against', {
        params: { userId: resolvedUserId },
      });

      return normalizeReports(response.data);
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const response = await apiClient.put(`/reports/resolve/${reportId}`, {
        status,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myReportsKey });
      await queryClient.invalidateQueries({ queryKey: againstReportsKey });
    },
    onError: (err: any) => {
      console.error('Resolve Report Error:', getReportErrorMessage(err, 'Failed to resolve report.'));
    },
  });

  const blockedUsersKey = ['reports', 'blocked', userId || 'me'];

  const blockedUsersQuery = useQuery({
    queryKey: blockedUsersKey,
    queryFn: async () => {
      let resolvedUserId = '';
      try {
        resolvedUserId = await resolveBackendUserId();
      } catch {
        // ignore
      }

      let serverList: BlockedUserItem[] = [];
      try {
        const response = await apiClient
          .get('/reports/blocked', { params: { userId: resolvedUserId } })
          .catch(() => apiClient.get('/users/blocked', { params: { userId: resolvedUserId } }));
        serverList = normalizeBlockedUsers(response.data);
      } catch {
        serverList = [];
      }

      // Merge with local AsyncStorage list for 100% reliability
      const localIds = resolvedUserId ? await getLocalBlockedUsers(resolvedUserId) : [];
      const knownIds = new Set(serverList.map((u) => String(u.userId)));

      for (const locId of localIds) {
        if (!knownIds.has(String(locId))) {
          serverList.push({
            userId: String(locId),
            name: `User ${locId}`,
            photo: undefined,
            blockedAt: null,
          });
          knownIds.add(String(locId));
        }
      }

      return serverList;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (data: { byUserId?: string | number; targetUserId: string | number }) => {
      let activeBy = data?.byUserId ? String(data.byUserId).trim() : '';
      if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
        try {
          activeBy = await resolveBackendUserId();
        } catch {
          activeBy = '';
        }
      }
      const targetStr = String(data.targetUserId).trim();
      const payload = {
        byUserId: activeBy,
        targetUserId: targetStr,
        blockerUserId: activeBy,
        blockedUserId: targetStr,
        userId: activeBy,
      };

      if (activeBy && targetStr) {
        await saveBlockedUser(activeBy, targetStr);
      }

      const response = await apiClient
        .post('/reports/block', payload, { params: { userId: activeBy, targetUserId: targetStr } })
        .catch(() => apiClient.post('/users/block', payload, { params: { userId: activeBy, targetUserId: targetStr } }));

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedUsersKey });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['discovery'] });
      await queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (err: any) => {
      console.error('Block Error:', getReportErrorMessage(err, 'Failed to block user.'));
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (data: { byUserId?: string | number; targetUserId: string | number }) => {
      let activeBy = data?.byUserId ? String(data.byUserId).trim() : '';
      if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
        try {
          activeBy = await resolveBackendUserId();
        } catch {
          activeBy = '';
        }
      }
      const targetStr = String(data.targetUserId).trim();
      const payload = {
        byUserId: activeBy,
        targetUserId: targetStr,
        blockerUserId: activeBy,
        unblockedUserId: targetStr,
        blockedUserId: targetStr,
        userId: activeBy,
      };

      if (activeBy && targetStr) {
        await removeBlockedUser(activeBy, targetStr);
      }

      const response = await apiClient
        .post('/reports/unblock', payload, { params: { userId: activeBy, targetUserId: targetStr } })
        .catch(() => apiClient.post('/users/unblock', payload, { params: { userId: activeBy, targetUserId: targetStr } }));

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedUsersKey });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['discovery'] });
      await queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (err: any) => {
      console.error('Unblock Error:', getReportErrorMessage(err, 'Failed to unblock user.'));
    },
  });

  return {
    report: reportMutation,
    block: blockMutation,
    unblock: unblockMutation,
    blockedUsers: blockedUsersQuery.data || [],
    isLoadingBlockedUsers: blockedUsersQuery.isLoading,
    refetchBlockedUsers: blockedUsersQuery.refetch,
    myReports: myReportsQuery.data || [],
    isLoadingMyReports: myReportsQuery.isLoading,
    againstReports: againstReportsQuery.data || [],
    isLoadingAgainstReports: againstReportsQuery.isLoading,
    resolveReport: resolveReportMutation,
    reportError: myReportsQuery.error ? getReportErrorMessage(myReportsQuery.error, 'Failed to load your reports.') : null,
    againstReportsError: againstReportsQuery.error ? getReportErrorMessage(againstReportsQuery.error, 'Failed to load reports against you.') : null,

    useMyReports: () => myReportsQuery,
    useReportsAgainst: () => againstReportsQuery,
    useBlockedUsers: () => blockedUsersQuery,
  };
};
