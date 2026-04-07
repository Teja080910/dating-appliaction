import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for Chat & Messaging
 * Chat APIs are not present in the provided Swagger, so this hook stays defensive
 * until the backend contract is documented.
 */
export const useChat = () => {
  const queryClient = useQueryClient();

  // ✅ Get Messages
  const useMessages = (chatId: number | string) =>
    useQuery({
      queryKey: ['chatMessages', chatId],
      queryFn: async () => [],
      enabled: false,
    });

  const sendMessage = useMutation({
    mutationFn: async (_payload: { chatId: any; message: string; type: string }) => {
      throw new Error('Chat API is not available in the current backend documentation.');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.chatId] });
    },
  });

  return {
    useMessages,
    sendMessage,
    // Aliases for ChatDetailScreen
    useSendMessage: () => sendMessage,
  };
};
