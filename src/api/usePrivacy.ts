import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

const normalizePlainResponse = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    return (
      (typeof record.message === 'string' && record.message.trim()) ||
      (typeof record.data === 'string' && record.data.trim()) ||
      record
    );
  }

  return '';
};

const normalizePrivacyStatus = (payload: unknown) => {
  if (typeof payload === 'boolean') {
    return payload;
  }

  if (typeof payload === 'string') {
    return payload.trim().toLowerCase() === 'true';
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.accepted ?? record.status ?? record.data ?? record.value;
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (typeof candidate === 'string') {
      return candidate.trim().toLowerCase() === 'true';
    }
  }

  return false;
};

const normalizePrivacyDetails = (payload: unknown) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const nestedData =
      record.data && typeof record.data === 'object' && !Array.isArray(record.data)
        ? (record.data as Record<string, unknown>)
        : null;

    return {
      ...(record || {}),
      ...(nestedData || {}),
      user:
        nestedData?.user ||
        record.user ||
        null,
      acceptedAt:
        (typeof nestedData?.acceptedAt === 'string' && nestedData.acceptedAt) ||
        (typeof record.acceptedAt === 'string' && record.acceptedAt) ||
        null,
    };
  }

  return null;
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

const normalizeReports = (payload: unknown) =>
  resolveReportsArray(payload).map((report) => ({
    id: typeof report?.id === 'number' ? report.id : 0,
    reportedUserId:
      typeof report?.reportedUserId === 'number' ? report.reportedUserId : null,
    reportedById:
      typeof report?.reportedById === 'number' ? report.reportedById : null,
    reason: String(report?.reason || '').trim(),
    message: String(report?.message || '').trim(),
    createdAt: report?.createdAt ? String(report.createdAt) : null,
  }));

/**
 * Privacy + Reports + Support Hook (Production Ready)
 */
export const usePrivacy = (userId?: string) => {
  const queryClient = useQueryClient();
  const resolveBackendUserId = async () => {
    const resolvedUserId = userId || (await getUserId());
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return Number(resolvedUserId);
  };

  // =========================
  // 🔐 PRIVACY SECTION
  // =========================

  const acceptTerms = useMutation({
    mutationFn: async (_uid?: string) => {
      const resolvedUserId = await resolveBackendUserId();
      const res = await apiClient.post('/privacy/accept', null, {
        params: { userId: resolvedUserId },
      });
      return normalizePlainResponse(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-status'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-details'] });
    },
  });

  const usePrivacyStatus = () =>
    useQuery({
      queryKey: ['privacy-status'],
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        const res = await apiClient.get('/privacy/status', {
          params: { userId: resolvedUserId },
        });
        return normalizePrivacyStatus(res.data);
      },
      staleTime: 1000 * 60 * 5, // 5 min cache
    });

  const usePrivacyDetails = () =>
    useQuery({
      queryKey: ['privacy-details'],
      queryFn: async () => {
        const resolvedUserId = await resolveBackendUserId();
        const res = await apiClient.get('/privacy/details', {
          params: { userId: resolvedUserId },
        });
        return normalizePrivacyDetails(res.data);
      },
      staleTime: 1000 * 60 * 5,
    });

  // =========================
  // 🚨 REPORT SECTION
  // =========================

  const reportUser = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiClient.post('/reports/report', {
        targetUserId: data?.targetUserId,
        reason: data?.reason,
        message: data?.message,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against'] });
    },
  });

  const useMyReports = () =>
    useQuery({
      queryKey: ['my-reports'],
      queryFn: async () => {
        const res = await apiClient.get('/reports/my');
        return normalizeReports(res.data);
      },
    });

  const useReportsAgainstMe = () =>
    useQuery({
      queryKey: ['reports-against'],
      queryFn: async () => {
        const res = await apiClient.get('/reports/against');
        return normalizeReports(res.data);
      },
    });

  const resolveReport = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const res = await apiClient.put(`/reports/resolve/${reportId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against'] });
    },
  });

  // =========================
  // 🆘 SUPPORT SECTION
  // =========================

  const createSupport = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiClient.post('/support/create', {
        subject: data?.subject,
        message: data?.message,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support'] });
    },
  });

  const useMySupportTickets = () =>
    useQuery({
      queryKey: ['my-support'],
      queryFn: async () => {
        const res = await apiClient.get('/support/my');
        return res.data;
      },
    });

  const closeSupportTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiClient.put(`/support/close/${ticketId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support'] });
    },
  });

  // =========================
  // 🚀 RETURN
  // =========================

  return {
    // Privacy
    acceptTerms,
    usePrivacyStatus,
    usePrivacyDetails,

    // Reports
    reportUser,
    useMyReports,
    useReportsAgainstMe,
    resolveReport,

    // Support
    createSupport,
    useMySupportTickets,
    closeSupportTicket,

    // Aliases
    hideProfile: acceptTerms,
    unhideProfile: acceptTerms,
    profileVisibility: acceptTerms,
    feedback: createSupport,
    suggestion: createSupport,
  };
};
