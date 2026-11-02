import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useNotification, EmailLogItem } from '../../api/useNotification';
import { Colors, Spacing, useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const formatTime = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return t('profile.notificationsscreen.m_ago', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('profile.notificationsscreen.h_ago', { hours });
  return date.toLocaleDateString();
};

const NotificationsScreen = () => {
  useTranslation();
  const navigation = useNavigation<any>();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);

  const { useNotificationList, markRead } = useNotification();
  const { data: notifications, isLoading, isRefetching, refetch } = useNotificationList();

  const list = Array.isArray(notifications) ? notifications : [];

  const handlePress = async (item: any) => {
    if (item && item.id != null && !item.read) {
      markRead.mutate(item.id);
    }

    const type = String(item?.type || '').toUpperCase();
    const title = String(item?.title || '').toLowerCase();
    const message = String(item?.message || item?.body || '').toLowerCase();

    let isMan = true;
    try {
      const [g1, g2] = await Promise.all([
        AsyncStorage.getItem('userGender'),
        AsyncStorage.getItem('selectedGender'),
      ]);
      const g = (g1 || g2 || '').toLowerCase();
      isMan = !g.includes('woman') && !g.includes('female');
    } catch {
      isMan = true;
    }

    // 1. Matches & Accepted Proposals / Connection Approvals
    const isAcceptedMatch =
      type.includes('MATCH') ||
      type.includes('ACCEPT') ||
      type.includes('APPROV') ||
      title.includes('accepted') ||
      title.includes('approved') ||
      title.includes('match') ||
      message.includes('accepted') ||
      message.includes('approved') ||
      message.includes('now chat') ||
      message.includes('telegram username is now available') ||
      message.includes('now connect');

    if (isAcceptedMatch) {
      if (isMan) {
        navigation.navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: 'accepted' },
        });
      } else {
        navigation.navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: 'accepted' },
        });
      }
      return;
    }

    // 2. Incoming Invitations & Date Proposals
    const isInvite =
      type.includes('INVIT') ||
      type.includes('CONNECT') ||
      type.includes('PROPOSAL') ||
      title.includes('invit') ||
      title.includes('proposal') ||
      title.includes('request') ||
      message.includes('invitation') ||
      message.includes('proposal') ||
      message.includes('sent you');

    if (isInvite) {
      if (isMan) {
        navigation.navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: 'pending' },
        });
      } else {
        navigation.navigate('BottomTabs', {
          screen: 'Invitations',
          params: { initialTab: 'pending' },
        });
      }
      return;
    }

    // 3. Telegram Handle / Chat Notifications
    const isTelegram =
      type.includes('TELEGRAM') ||
      title.includes('telegram') ||
      message.includes('telegram');

    if (isTelegram) {
      if (isMan) {
        navigation.navigate('BottomTabs', {
          screen: 'Sent',
          params: { initialTab: 'accepted' },
        });
      } else {
        navigation.navigate('BottomTabs', {
          screen: 'Telegram',
        });
      }
      return;
    }

    // 4. Subscriptions / Plans / Upgrades
    const isSubscription =
      type.includes('SUB') ||
      type.includes('PLAN') ||
      type.includes('PAY') ||
      title.includes('subscri') ||
      title.includes('plan') ||
      title.includes('premium') ||
      title.includes('gold') ||
      message.includes('subscri') ||
      message.includes('premium') ||
      message.includes('plan');

    if (isSubscription) {
      navigation.navigate('BottomTabs', { screen: 'Profile' });
      return;
    }

    // 5. Profile & Verification Status
    const isProfile =
      type.includes('VERIF') ||
      type.includes('PROFILE') ||
      title.includes('profile') ||
      title.includes('verification') ||
      title.includes('photo') ||
      message.includes('profile') ||
      message.includes('verification');

    if (isProfile) {
      navigation.navigate('BottomTabs', { screen: 'Profile' });
      return;
    }

    // 6. Informational Alert fallback
    if (item?.title || item?.message || item?.body) {
      Alert.alert(item.title || 'Notification', item.message || item.body || '');
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    const isRead = Boolean(item?.read);
    return (
      <TouchableOpacity
        style={[styles.item, !isRead && styles.itemUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconCircle, !isRead && styles.iconCircleUnread]}>
          <Icon name="bell" size={18} color={isRead ? themeColors.textSecondary : themeColors.primary} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, !isRead && styles.itemTitleUnread]} numberOfLines={1}>
              {item?.title || t('profile.notificationsscreen.notification')}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item?.body || item?.message || ''}
          </Text>
          <Text style={styles.itemTime}>{formatTime(item?.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.notificationsscreen.notifications')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : list.length > 0 ? (
        <FlatList
          style={{ flex: 1 }}
          data={list}
          keyExtractor={(item, index) =>
            item?.id != null ? String(item.id) : String(index)
          }
          renderItem={renderNotificationItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
        />
      ) : (
        <View style={styles.emptyView}>
          <View style={styles.emptyIcon}>
            <Icon name="bell-off" size={40} color={themeColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t('profile.notificationsscreen.no_notifications')}</Text>
          <Text style={styles.emptyDesc}>{t('profile.notificationsscreen.when_you_receive_likes_matches_or_messages_they_will_show_up_here')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const createStyles = (colors: any, isDark: boolean = true) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 44,
    },
    tabsRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Spacing.radiusMd,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border || colors.glassBorder,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Spacing.radiusSm,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    statusBadge: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    listContainer: {
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingBottom: Spacing.xl,
    },
    item: {
      flexDirection: 'row',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: Spacing.radiusLg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border || colors.glassBorder,
    },
    itemUnread: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.primary,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      marginRight: Spacing.md,
    },
    iconCircleUnread: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      flexShrink: 1,
      marginRight: Spacing.sm,
    },
    itemTitleUnread: {
      color: colors.text,
      fontWeight: '700',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    itemBody: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    itemTime: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 6,
    },
    emptyView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
