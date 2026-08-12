import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { getUserId } from '../utils/sessionHelper';

export interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: string;
  createdAt: string | null;
  userId: number | null;
}

const resolveTicketArray = (payload: unknown): any[] => {
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
    if (Array.isArray(record.tickets)) {
      return record.tickets as any[];
    }
  }

  return [];
};

const normalizeSupportTickets = (payload: unknown): SupportTicket[] =>
  resolveTicketArray(payload).map((ticket) => ({
    id: typeof ticket?.id === 'number' ? ticket.id : 0,
    subject: String(ticket?.subject || '').trim() || 'Support',
    message: String(ticket?.message || '').trim(),
    status: String(ticket?.status || 'OPEN').trim().toUpperCase(),
    createdAt: ticket?.createdAt ? String(ticket.createdAt) : null,
    userId: typeof ticket?.user?.id === 'number' ? ticket.user.id : null,
  }));

const getSupportErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  fallback;

export const useSupport = (userId?: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ['support', 'my'];
  const resolveBackendUserId = async (candidate?: string | number | null) => {
    const resolvedUserId = String(candidate ?? userId ?? '').trim() || await getUserId();
    if (!resolvedUserId) {
      throw new Error('Unable to resolve backend userId from session.');
    }
    return resolvedUserId;
  };

  const createTicket = useMutation({
    mutationFn: async (data: { userId?: number; subject: string; message: string }) => {
      const resolvedUserId = await resolveBackendUserId(data.userId);
      const response = await apiClient.post('/support/create', {
        userId: resolvedUserId,
        subject: data.subject,
        message: data.message,
      }, {
        params: { userId: resolvedUserId },
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const myTicketsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient.get('/support/my', {
        params: { userId: resolvedUserId },
      });

      return normalizeSupportTickets(response.data);
    },
  });

  const closeTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const resolvedUserId = await resolveBackendUserId();
      const response = await apiClient.put(`/support/close/${ticketId}`, null, {
        params: { userId: resolvedUserId },
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const getTicketsByStatus = async (status: string) => {
    const resolvedUserId = await resolveBackendUserId();
    const response = await apiClient.get('/support/status', {
      params: { status, userId: resolvedUserId },
    });
    return normalizeSupportTickets(response.data);
  };

  return {
    createTicket,
    tickets: myTicketsQuery.data || [],
    isLoadingTickets: myTicketsQuery.isLoading,
    isFetchingTickets: myTicketsQuery.isFetching,
    ticketsError: myTicketsQuery.error ? getSupportErrorMessage(myTicketsQuery.error, 'Failed to load support tickets.') : null,
    getTicketsByStatus,
    closeTicket,
    refreshTickets: myTicketsQuery.refetch,
    getSupportErrorMessage,
  };
};
