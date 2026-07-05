import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { privacyApi } from '../api/privacyApi';
import { AuthStorage } from '../api/authStorage';
import { colors, radius, shadow, typography } from '../constants/theme';

const PrivacyStatusScreen = () => {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchStatus = async () => {
        setLoading(true);
        try {
          const userIdNum = await AuthStorage.getUserId();
          if (userIdNum) {
            const status = await privacyApi.getStatus(userIdNum);
            setAccepted(status);
          }
        } catch {
          setAccepted(null);
        } finally {
          setLoading(false);
        }
      };
      fetchStatus();
    }, [])
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
        <Text style={s.title}>Privacy Status</Text>
      </View>
      <View style={s.content}>
        {accepted === null ? (
          <Text style={s.statusText}>Couldn't load your privacy acceptance status.</Text>
        ) : accepted ? (
          <View style={[s.badge, s.badgeAccepted]}>
            <Icon name="check-circle" solid size={18} color={colors.success} style={s.badgeIcon} />
            <Text style={s.badgeText}>You've accepted our Privacy Policy & Terms</Text>
          </View>
        ) : (
          <View style={[s.badge, s.badgePending]}>
            <Icon name="exclamation-circle" solid size={18} color={colors.warning} style={s.badgeIcon} />
            <Text style={s.badgeText}>You haven't accepted our Privacy Policy yet</Text>
          </View>
        )}

        <TouchableOpacity
          style={s.linkRow}
          onPress={() => Linking.openURL('https://example.com/privacy')}
        >
          <Text style={s.linkText}>View Privacy Policy</Text>
          <Icon name="chevron-right" size={12} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.display, color: colors.ink },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  statusText: { fontSize: 15, color: colors.inkMuted },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, padding: 16, marginBottom: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    ...shadow.soft,
  },
  badgeIcon: { marginRight: 10 },
  badgeAccepted: { backgroundColor: colors.successLight, borderColor: colors.successLight },
  badgePending: { backgroundColor: colors.warningLight, borderColor: colors.warningLight },
  badgeText: { ...typography.bodyMedium, color: colors.ink, flex: 1 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  linkText: { fontSize: 15, color: colors.primary, fontWeight: '700' },
});

export default PrivacyStatusScreen;
