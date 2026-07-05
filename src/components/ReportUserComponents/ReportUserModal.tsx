import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { reportApi } from '../../api/reportApi';
import { AuthStorage } from '../../api/authStorage';
import { colors, radius, shadow } from '../../constants/theme';

const REASONS = ['Fake profile', 'Inappropriate content', 'Harassment', 'Spam', 'Other'];

interface Props {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
}

const ReportUserModal = ({ visible, onClose, targetUserId }: Props) => {
  const [reason, setReason] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    setSubmitting(true);
    try {
      const byUserIdNum = await AuthStorage.getUserId();
      if (!byUserIdNum) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }
      const targetIdNum = Number(String(targetUserId).replace(/\D/g, '')) || undefined;
      await reportApi.reportUser({
        byUserId: byUserIdNum,
        targetUserId: targetIdNum as number,
        reason,
        message: message.trim() || undefined,
      });
      Alert.alert('Reported', 'Thanks for letting us know. Our team will review this.');
      setReason(null);
      setMessage('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Report User</Text>
          <View style={styles.reasonList}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, reason === r && styles.reasonChipSelected]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Additional details (optional)"
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, width: '85%', ...shadow.card },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.ink, marginBottom: 20, textAlign: 'center' },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  reasonChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surfaceAlt,
  },
  reasonChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  reasonText: { fontSize: 13, color: colors.inkMuted },
  reasonTextSelected: { color: colors.surface, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 15, color: colors.ink, marginBottom: 12, minHeight: 70, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.inkMuted, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  submitBtnText: { color: colors.surface, fontWeight: '600' },
});

export default ReportUserModal;
