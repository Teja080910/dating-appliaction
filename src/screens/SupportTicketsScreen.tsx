import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supportApi } from '../api/supportApi';
import { AuthStorage } from '../api/authStorage';
import { Support } from '../api/types';
import { colors, radius, shadow, typography } from '../constants/theme';

const extractList = (data: any): Support[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  return [];
};

const SupportTicketsScreen = () => {
  const [tickets, setTickets] = useState<Support[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(false);
    try {
      const userIdNum = await AuthStorage.getUserId();
      if (!userIdNum) {
        setError(true);
        return;
      }
      const data = await supportApi.myTickets(userIdNum);
      setTickets(extractList(data));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(true);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }
    setSubmitting(true);
    try {
      const userIdNum = await AuthStorage.getUserId();
      if (!userIdNum) return;
      await supportApi.createTicket({ userId: userIdNum, subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setModalVisible(false);
      fetchTickets();
      Alert.alert('Submitted', 'Your support ticket has been created.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: Support }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.subject}>{item.subject}</Text>
        {item.status ? (
          <View style={[s.statusBadge, item.status === 'CLOSED' ? s.statusClosed : s.statusOpen]}>
            <Text style={s.statusText}>{item.status}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.messageText}>{item.message}</Text>
      {item.createdAt ? <Text style={s.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text> : null}
    </View>
  );

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Support</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.newBtnText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Couldn't load tickets due to a server issue. Your ticket was still created — please try again later to view it.</Text>
        </View>
      ) : tickets.length > 0 ? (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={s.centered}>
          <Text style={s.emptyText}>No support tickets yet</Text>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>New Support Ticket</Text>
            <TextInput
              style={s.input}
              placeholder="Subject"
              placeholderTextColor={colors.inkFaint}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[s.input, s.messageInput]}
              placeholder="Describe your issue"
              placeholderTextColor={colors.inkFaint}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={s.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { ...typography.display, color: colors.ink },
  newBtn: { backgroundColor: colors.primary, paddingVertical: 9, paddingHorizontal: 18, borderRadius: radius.pill },
  newBtnText: { color: colors.surface, fontWeight: '700', fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { fontSize: 16, color: colors.inkMuted, textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subject: { ...typography.bodyMedium, color: colors.ink, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.md, marginLeft: 8 },
  statusOpen: { backgroundColor: colors.warningLight },
  statusClosed: { backgroundColor: colors.successLight },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  messageText: { fontSize: 14, color: colors.inkMuted },
  timestamp: { ...typography.caption, color: colors.inkMuted, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, width: '85%' },
  modalTitle: { ...typography.heading, color: colors.ink, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 15, color: colors.ink, marginBottom: 12, backgroundColor: colors.surfaceAlt,
  },
  messageInput: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.inkMuted, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  submitBtnText: { color: colors.surface, fontWeight: '700' },
});

export default SupportTicketsScreen;
