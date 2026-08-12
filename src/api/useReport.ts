import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

export interface ReportItem {
  id: number;
  reportedUserId: number | null;
  reportedById: number | null;
  reason: string;
  message: string;
  createdAt: string | null;
}

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
    id: typeof report?.id === 'number' ? report.id : 0,
    reportedUserId:
      typeof report?.reportedUserId === 'number' ? report.reportedUserId : null,
    reportedById:
      typeof report?.reportedById === 'number' ? report.reportedById : null,
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

  const resolveBackendUserId = async () => {
    if (userId) return String(userId);
    const stored = await getUserId();
    if (!stored) throw new Error('Unable to resolve backend userId for reports.');
    return stored;
  };
  const myReportsKey = ['reports', 'my'];
  const againstReportsKey = ['reports', 'against'];

  const reportMutation = useMutation({
    mutationFn: async (data: { byUserId: string | number; targetUserId: string | number; reason: string; message: string }) => {
      const response = await apiClient.post('/reports/report', {
        byUserId: String(data.byUserId),
        targetUserId: String(data.targetUserId),
        reason: data.reason,
        message: data.message,
      });
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

  return {
    report: reportMutation,
    myReports: myReportsQuery.data || [],
    isLoadingMyReports: myReportsQuery.isLoading,
    againstReports: againstReportsQuery.data || [],
    isLoadingAgainstReports: againstReportsQuery.isLoading,
    resolveReport: resolveReportMutation,
    reportError: myReportsQuery.error ? getReportErrorMessage(myReportsQuery.error, 'Failed to load your reports.') : null,
    againstReportsError: againstReportsQuery.error ? getReportErrorMessage(againstReportsQuery.error, 'Failed to load reports against you.') : null,

    useMyReports: () => myReportsQuery,
    useReportsAgainst: () => againstReportsQuery,
  };
};
